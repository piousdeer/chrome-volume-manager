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
      respond(undefined) // Nothing to send here.
      await setTabVolume(message.tabId, message.value)
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

// We use promises to fight race conditions.
const tabs: { [tabId: number]: Promise<CapturedTab> } = {}

/**
 * Captures a tab's sound, allowing it to be programmatically modified.
 * Puts a promise into the `tabs` object. We only need to call this function
 * if the tab isn't yet in that object.
 * @param tabId Tab ID
 */
function captureTab (tabId: number) {
  tabs[tabId] = new Promise(async resolve => {
    const stream = await chrome.tabCapture.capture({ audio: true, video: false })

    const audioContext = new AudioContext()
    const streamSource = audioContext.createMediaStreamSource(stream)
    const gainNode = audioContext.createGain()

    streamSource.connect(gainNode)
    gainNode.connect(audioContext.destination)

    resolve({ audioContext, streamSource, gainNode })
  })
}

/**
 * Returns a tab's volume, `1` if the tab isn't captured yet.
 * @param tabId Tab ID
 */
async function getTabVolume (tabId: number) {
  return tabId in tabs ? (await tabs[tabId]).gainNode.gain.value : 1
}

/**
 * Sets a tab's volume. Captures the tab if it wasn't captured.
 * @param tabId Tab ID
 * @param value Volume. `1` means 100%, `0.5` is 50%, etc
 */
async function setTabVolume (tabId: number, value: number) {
  if (!(tabId in tabs)) {
    captureTab(tabId)
  }

  (await tabs[tabId]).gainNode.gain.value = value
  updateBadge(tabId, value)
}

/**
 * Updates the badge which represents current volume.
 * @param tabId Tab ID
 * @param value Volume. `1` will display 100, `0.5` - 50, etc
 */
async function updateBadge (tabId: number, value: number) {
  if (tabId in tabs) {
    const text = String(Math.round(value * 100)) // I love rounding errors!
    chrome.browserAction.setBadgeText({ text, tabId })
  }
}

/**
 * Removes the tab from `tabs` object and closes its AudioContext.
 * This function gets called when a tab is closed.
 * @param tabId Tab ID
 */
async function disposeTab (tabId: number) {
  if (tabId in tabs) {
    (await tabs[tabId]).audioContext.close()
    delete tabs[tabId]
  }
}
