type Message = {
  name: 'get-tab-volume',
  tabId: number
} | {
  name: 'set-tab-volume',
  tabId: number,
  value: number
}

export default Message
