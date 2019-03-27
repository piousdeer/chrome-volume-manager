<center>
  <h1 align="center">Volume Manager</h1>
  <h3 align="center">A simple Chrome extension to control any tab's volume separately.</h3>
  <img align="center" src='https://owo.sh/65AVTty.png' />
</center><br>

* Click on the extension icon and drag the slider to adjust the volume of the active tab
* You can reduce its volume down to 0% and boost it up to 600%
* The current volume is displayed as a badge next to the icon

There are several similar extensions. However, they're either filled with telemetry and analytics, or their UI sucks.

# Usage
This extension is not in Chrome Web Store yet; you have to build it yourself.
1. Clone this repository
2. Run `npm install && npm run build`
3. Go to `chrome://extensions/`, enable developer mode and load `dist` folder as an unpacked extension
