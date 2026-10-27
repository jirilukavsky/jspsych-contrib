# plugin-mouse-reading

## Overview

Mouse tracking for reading experiments

## Loading

### In browser

```html
<script src="https://unpkg.com/@jspsych-contrib/plugin-mouse-reading"></script>
```

### Via NPM

```
npm install @jspsych-contrib/plugin-mouse-reading
```

```js
import MouseReading from "@jspsych-contrib/plugin-mouse-reading";
```

## Compatibility

`@jspsych-contrib/plugin-mouse-reading` requires jsPsych v8.0.0 or later.

**Safari browsers are not supported**. 
The text blur depends on `ctx.filter`, 
which is not supported in Safari browsers and blurs nothing. 
The plugin does not check the browser, 
please make your own detection in the beginning of the experiment.

The plugin supports mouse events, but not touch events. 
On touch devices, the text would be covered with participant's fingertip. 
The plugin does not specifically respond if the user uses a touch device, 
it should be detected in the beginning of the experiment.

## Documentation

See [documentation](https://github.com/jspsych/jspsych-contrib/packages/plugin-mouse-reading/README.md)

## Author / Citation

[Jiri Lukavsky](https://github.com/jirilukavsky)