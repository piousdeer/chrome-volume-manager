/// <reference path="../node_modules/chrome-extension-async/chrome-extension-async.d.ts" />
import 'chrome-extension-async'

import Message from './interfaces/Message'

// Handle messages from popup
chrome.runtime.onMessage.addListener(async (message: Message, sender, respond) => {
  switch (message.name) {
    case 'get-tab-volume':
      respond(await getTabVolume(message.tabId))
      break
    case 'set-tab-volume':
      respond(await setTabVolume(message.tabId, message.value))
      break
    default:
      throw Error(`Unknown message received: ${message}`)
  }
})

// Clean everything up once the tab is closed
chrome.tabs.onRemoved.addListener(disposeTab)

interface CapturedTab {
  audioContext: AudioContext,
  // While we will never use `streamSource` property in the code,
  // it is necessary to keep a reference to it, or else
  // it will get garbage-collected and the sound will be gone.
  streamSource: MediaStreamAudioSourceNode,
  gainNode: GainNode
}

const capturedTabs: { [tabId: number]: CapturedTab } = {}

// A map with promises to fight race conditions.
// TODO: use a single map instead of a map and an object.
const waitingTabs: Map<number, Promise<void>> = new Map()

async function captureTab (tabId: number) {
  const promise = new Promise<void>(async resolve => {
    const stream = await chrome.tabCapture.capture({ audio: true, video: false })

    const audioContext = new AudioContext()
    const streamSource = audioContext.createMediaStreamSource(stream)
    const gainNode = audioContext.createGain()

    streamSource.connect(gainNode)
    gainNode.connect(audioContext.destination)

    capturedTabs[tabId] = { audioContext, streamSource, gainNode }

    waitingTabs.delete(tabId)
    resolve()
  })

  waitingTabs.set(tabId, promise)
  return promise
}

async function isCaptured (tabId: number) {
  await waitingTabs.get(tabId)
  return tabId in capturedTabs
}

async function getTabVolume (tabId: number) {
  return await isCaptured(tabId) ? capturedTabs[tabId].gainNode.gain.value : 1
}

async function setTabVolume (tabId: number, value: number) {
  if (!await isCaptured(tabId)) {
    await captureTab(tabId)
  }

  capturedTabs[tabId].gainNode.gain.value = value
  updateBadge(tabId, value)
}

async function updateBadge (tabId: number, value: number) {
  if (await isCaptured(tabId)) {
    const text = String(Math.round(value * 100)) // I love rounding errors!
    chrome.browserAction.setBadgeText({ text, tabId })
  }
}

async function disposeTab (tabId: number) {
  if (await isCaptured(tabId)) {
    await capturedTabs[tabId].audioContext.close()
    delete capturedTabs[tabId]
  }
}
