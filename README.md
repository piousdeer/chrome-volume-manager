<center>
  <h1>Volume Manager</h1>
  <h3>A simple Chrome extension to control any tab's volume separately.</h3>
  <img src='https://owo.sh/8c4ac5.png' />
</center><br>

* Click on the extension's icon and drag the slider to control the volume of the active tab
* You can reduce its volume down to 0% and boost it up to 600%
* Current volume is displayed as a badge next to the icon

There are several similar extensions. However, they're either filled with telemetry and analytics, or their UI sucks.

# Usage
I will publish this extension on Chrome Web Store later. At the moment you have to build it yourself.
1. Clone this repository
2. Run `npm install && npm run build`
3. Go to `chrome://extensions/`, enable developer mode and load `dist` folder as an unpacked extension
