require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var getVendorPropertyName = require('./getVendorPropertyName');

module.exports = function(target, sources) {
  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  var prefixed = {};
  for (var key in to) {
    prefixed[getVendorPropertyName(key)] = to[key]
  }

  return prefixed
}

},{"./getVendorPropertyName":3}],2:[function(require,module,exports){
'use strict';

var cssVendorPrefix;

module.exports = function() {

  if (cssVendorPrefix) return cssVendorPrefix;

  var styles = window.getComputedStyle(document.documentElement, '');
  var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

  return cssVendorPrefix = '-' + pre + '-';
}

},{}],3:[function(require,module,exports){
'use strict';

var div = document.createElement('div');
var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
var domVendorPrefix;

// Helper function to get the proper vendor property name. (transition => WebkitTransition)
module.exports = function(prop) {

  if (prop in div.style) return prop;

  var prop = prop.charAt(0).toUpperCase() + prop.substr(1);
  if (domVendorPrefix) {
    return domVendorPrefix + prop;
  } else {
    for (var i = 0; i < prefixes.length; ++i) {
      var vendorProp = prefixes[i] + prop;
      if (vendorProp in div.style) {
        domVendorPrefix = prefixes[i];
        return vendorProp;
      }
    }
  }
}

},{}],4:[function(require,module,exports){
'use strict';

var insertRule = require('./insertRule');
var vendorPrefix = require('./getVendorPrefix')();
var index = 0;

module.exports = function(keyframes) {
  // random name
  var name = 'anim_' + (++index) + (+new Date);
  var css = "@" + vendorPrefix + "keyframes " + name + " {";

  for (var key in keyframes) {
    css += key + " {";

    for (var property in keyframes[key]) {
      var part = ":" + keyframes[key][property] + ";";
      // We do vendor prefix for every property
      css += vendorPrefix + property + part;
      css += property + part;
    }

    css += "}";
  }

  css += "}";

  insertRule(css);

  return name
}

},{"./getVendorPrefix":2,"./insertRule":5}],5:[function(require,module,exports){
'use strict';

var extraSheet;

module.exports = function(css) {

  if (!extraSheet) {
    // First time, create an extra stylesheet for adding rules
    extraSheet = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(extraSheet);
    // Keep reference to actual StyleSheet object (`styleSheet` for IE < 9)
    extraSheet = extraSheet.sheet || extraSheet.styleSheet;
  }

  var index = (extraSheet.cssRules || extraSheet.rules).length;
  extraSheet.insertRule(css, index);

  return extraSheet;
}

},{}],6:[function(require,module,exports){
'use strict';

/**
 * EVENT_NAME_MAP is used to determine which event fired when a
 * transition/animation ends, based on the style property used to
 * define that event.
 */
var EVENT_NAME_MAP = {
  transitionend: {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'mozTransitionEnd',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd'
  },

  animationend: {
    'animation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd',
    'MozAnimation': 'mozAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd'
  }
};

var endEvents = [];

function detectEvents() {
  var testEl = document.createElement('div');
  var style = testEl.style;

  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are useable, and if not remove them
  // from the map
  if (!('AnimationEvent' in window)) {
    delete EVENT_NAME_MAP.animationend.animation;
  }

  if (!('TransitionEvent' in window)) {
    delete EVENT_NAME_MAP.transitionend.transition;
  }

  for (var baseEventName in EVENT_NAME_MAP) {
    var baseEvents = EVENT_NAME_MAP[baseEventName];
    for (var styleName in baseEvents) {
      if (styleName in style) {
        endEvents.push(baseEvents[styleName]);
        break;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  detectEvents();
}


// We use the raw {add|remove}EventListener() call because EventListener
// does not know how to remove event listeners and we really should
// clean up. Also, these events are not triggered in older browsers
// so we should be A-OK here.

function addEventListener(node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false);
}

module.exports = {
  addEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      // If CSS transitions are not supported, trigger an "end animation"
      // event immediately.
      window.setTimeout(eventListener, 0);
      return;
    }
    endEvents.forEach(function(endEvent) {
      addEventListener(node, endEvent, eventListener);
    });
  },

  removeEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      return;
    }
    endEvents.forEach(function(endEvent) {
      removeEventListener(node, endEvent, eventListener);
    });
  }
};

},{}],7:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
    },

    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
    },

    showModalAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'translate3d(-50%, -300px, 0)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate3d(-50%, -50%, 0)'
        }
    }),

    hideModalAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate3d(-50%, -50%, 0)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate3d(-50%, 100px, 0)'
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        }
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    }),

    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'translate3d(0, -20px, 0)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate3d(0, 50px, 0)'
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showModalAnimation = animation.showModalAnimation;
var hideModalAnimation = animation.hideModalAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'modal';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%",
            backgroundColor: "white",
            zIndex: 1050,
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideModalAnimation : showModalAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationDelay: '0.25s',
            animationName: showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],8:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    hide: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({

        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 1
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],9:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out'
    },
    hide: {
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({

        '0%': {
            opacity: 0,
            transform: 'translate3d(calc(-100vw - 50%), 0, 0)'
        },
        '50%': {
            opacity: 1,
            transform: 'translate3d(100px, 0, 0)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({

        '0%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        },
        '50%': {
            opacity: 1,
            transform: 'translate3d(-100px, 0, 0) scale3d(1.1, 1.1, 1)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate3d(calc(100vw + 50%), 0, 0)'
        },
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '90%': {
            opactiy: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],10:[function(require,module,exports){
var modalFactory = require('./modalFactory');

var React = require('react');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.8s',
        animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
    },
    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
        },
        '40%':{
            opacity: 0
        },
        '100%': {
            opacity: 1,
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getSharp: function(willHidden) {
        var strokeDashLength = 1680;

        var showSharpAnimation = insertKeyframesRule({
            '0%': {
                'stroke-dashoffset': strokeDashLength
            },
            '100%': {
                'stroke-dashoffset': 0
            },
        });


        var sharpStyle = {
            position: 'absolute',
            width: 'calc(100%)',
            height: 'calc(100%)',
            zIndex: '-1'
        };

        var rectStyle = appendVendorPrefix({
            animationDuration: willHidden? '0.4s' :'0.8s',
            animationFillMode: 'forwards',
            animationName: willHidden? hideContentAnimation: showSharpAnimation,
            stroke: '#ffffff',
            strokeWidth: '2px',
            strokeDasharray: strokeDashLength
        });

        return React.createElement("div", {style: sharpStyle}, 
            React.createElement("svg", {
                xmlns: "http://www.w3.org/2000/svg", 
                width: "100%", 
                height: "100%", 
                viewBox: "0 0 496 136", 
                preserveAspectRatio: "none"}, 
                React.createElement("rect", {style: rectStyle, 
                    x: "2", 
                    y: "2", 
                    fill: "none", 
                    width: "492", 
                    height: "132"})
            )
        )
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.4s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react":undefined,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],11:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
    },
    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'scale3d(0, 0, 1)'
        },
        '100%': {
            opacity: 1,
            transform: 'scale3d(1, 1, 1)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
            transform: 'scale3d(0.5, 0.5, 1)'
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.4s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],12:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '1s',
        animationTimingFunction: 'linear'
    },
    hide: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'matrix3d(0.7, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '2.083333%': {
            transform: 'matrix3d(0.75266, 0, 0, 0, 0, 0.76342, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '4.166667%': {
            transform: 'matrix3d(0.81071, 0, 0, 0, 0, 0.84545, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '6.25%': {
            transform: 'matrix3d(0.86808, 0, 0, 0, 0, 0.9286, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '8.333333%': {
            transform: 'matrix3d(0.92038, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '10.416667%': {
            transform: 'matrix3d(0.96482, 0, 0, 0, 0, 1.05202, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '12.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 1.08204, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '14.583333%': {
            transform: 'matrix3d(1.02563, 0, 0, 0, 0, 1.09149, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '16.666667%': {
            transform: 'matrix3d(1.04227, 0, 0, 0, 0, 1.08453, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '18.75%': {
            transform: 'matrix3d(1.05102, 0, 0, 0, 0, 1.06666, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '20.833333%': {
            transform: 'matrix3d(1.05334, 0, 0, 0, 0, 1.04355, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '22.916667%': {
            transform: 'matrix3d(1.05078, 0, 0, 0, 0, 1.02012, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '25%': {
            transform: 'matrix3d(1.04487, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '27.083333%': {
            transform: 'matrix3d(1.03699, 0, 0, 0, 0, 0.98534, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '29.166667%': {
            transform: 'matrix3d(1.02831, 0, 0, 0, 0, 0.97688, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '31.25%': {
            transform: 'matrix3d(1.01973, 0, 0, 0, 0, 0.97422, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '33.333333%': {
            transform: 'matrix3d(1.01191, 0, 0, 0, 0, 0.97618, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '35.416667%': {
            transform: 'matrix3d(1.00526, 0, 0, 0, 0, 0.98122, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '37.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 0.98773, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '39.583333%': {
            transform: 'matrix3d(0.99617, 0, 0, 0, 0, 0.99433, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '41.666667%': {
            transform: 'matrix3d(0.99368, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '43.75%': {
            transform: 'matrix3d(0.99237, 0, 0, 0, 0, 1.00413, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '45.833333%': {
            transform: 'matrix3d(0.99202, 0, 0, 0, 0, 1.00651, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '47.916667%': {
            transform: 'matrix3d(0.99241, 0, 0, 0, 0, 1.00726, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '50%': {
            opacity: 1,
            transform: 'matrix3d(0.99329, 0, 0, 0, 0, 1.00671, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '52.083333%': {
            transform: 'matrix3d(0.99447, 0, 0, 0, 0, 1.00529, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '54.166667%': {
            transform: 'matrix3d(0.99577, 0, 0, 0, 0, 1.00346, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '56.25%': {
            transform: 'matrix3d(0.99705, 0, 0, 0, 0, 1.0016, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '58.333333%': {
            transform: 'matrix3d(0.99822, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '60.416667%': {
            transform: 'matrix3d(0.99921, 0, 0, 0, 0, 0.99884, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '62.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 0.99816, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '64.583333%': {
            transform: 'matrix3d(1.00057, 0, 0, 0, 0, 0.99795, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '66.666667%': {
            transform: 'matrix3d(1.00095, 0, 0, 0, 0, 0.99811, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '68.75%': {
            transform: 'matrix3d(1.00114, 0, 0, 0, 0, 0.99851, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '70.833333%': {
            transform: 'matrix3d(1.00119, 0, 0, 0, 0, 0.99903, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '72.916667%': {
            transform: 'matrix3d(1.00114, 0, 0, 0, 0, 0.99955, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '75%': {
            transform: 'matrix3d(1.001, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '77.083333%': {
            transform: 'matrix3d(1.00083, 0, 0, 0, 0, 1.00033, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '79.166667%': {
            transform: 'matrix3d(1.00063, 0, 0, 0, 0, 1.00052, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '81.25%': {
            transform: 'matrix3d(1.00044, 0, 0, 0, 0, 1.00058, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '83.333333%': {
            transform: 'matrix3d(1.00027, 0, 0, 0, 0, 1.00053, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '85.416667%': {
            transform: 'matrix3d(1.00012, 0, 0, 0, 0, 1.00042, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '87.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 1.00027, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '89.583333%': {
            transform: 'matrix3d(0.99991, 0, 0, 0, 0, 1.00013, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '91.666667%': {
            transform: 'matrix3d(0.99986, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '93.75%': {
            transform: 'matrix3d(0.99983, 0, 0, 0, 0, 0.99991, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '95.833333%': {
            transform: 'matrix3d(0.99982, 0, 0, 0, 0, 0.99985, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '97.916667%': {
            transform: 'matrix3d(0.99983, 0, 0, 0, 0, 0.99984, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '100%': {
            opacity: 1,
            transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
            transform: 'scale3d(0.8, 0.8, 1)'
        },
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],13:[function(require,module,exports){
var React = require('react');
var transitionEvents = require('react-kit/transitionEvents');

module.exports = function(animation){

    return React.createClass({
        propTypes: {
            className: React.PropTypes.string,
            // Close the modal when esc is pressed? Defaults to true.
            keyboard: React.PropTypes.bool,
            onShow: React.PropTypes.func,
            onHide: React.PropTypes.func,
            animation: React.PropTypes.object,
            backdrop: React.PropTypes.oneOfType([
                React.PropTypes.bool,
                React.PropTypes.string
            ])
        },

        getDefaultProps: function() {
            return {
                className: "",
                onShow: function(){},
                onHide: function(){},
                animation: animation,
                keyboard: true,
                backdrop: true
            };
        },

        getInitialState: function(){
            return {
                willHidden: false,
                hidden: true
            }
        },

        hasHidden: function(){
            return this.state.hidden;
        },

        componentDidMount: function(){
            var ref = this.props.animation.getRef();
            var node = this.refs[ref].getDOMNode();
            var endListener = function(e) {
                if (e && e.target !== node) {
                    return;
                }
                transitionEvents.removeEndEventListener(node, endListener);
                this.enter();

            }.bind(this);
            transitionEvents.addEndEventListener(node, endListener);
        },

        render: function() {

            var hidden = this.hasHidden();
            if(hidden) return null;

            var willHidden = this.state.willHidden;
            var animation = this.props.animation;
            var modalStyle = animation.getModalStyle(willHidden);
            var backdropStyle = animation.getBackdropStyle(willHidden);
            var contentStyle = animation.getContentStyle(willHidden);
            var ref = animation.getRef(willHidden);
            var sharp = animation.getSharp && animation.getSharp(willHidden);
            var backdrop = this.props.backdrop? React.createElement("div", {onClick: this.hide, style: backdropStyle}): undefined;

            if(willHidden) {
                var node = this.refs[ref].getDOMNode();
                var endListener = function(e) {
                    if (e && e.target !== node) {
                        return;
                    }

                    transitionEvents.removeEndEventListener(node, endListener);
                    this.leave();

                }.bind(this);
                transitionEvents.addEndEventListener(node, endListener);
            }

            return (React.createElement("span", null, 
                React.createElement("div", {ref: "modal", style: modalStyle, className: this.props.className}, 
                    sharp, 
                    React.createElement("div", {ref: "content", tabIndex: "-1", style: contentStyle}, 
                        this.props.children
                    )
                ), 
                backdrop
             ))
            ;
        },

        leave: function(){
            this.setState({
                hidden: true
            });
            this.props.onHide();
        },

        enter: function(){
            this.props.onShow();
        },

        show: function(){
            if(!this.hasHidden()) return;

            this.setState({
                willHidden: false,
                hidden: false
            });
        },

        hide: function(){
            if(this.hasHidden()) return;

            this.setState({
                willHidden: true
            });
        },

        toggle: function(){
            if(this.hasHidden())
                this.show();
            else
                this.hide();
        },

        listenKeyboard: function(event) {
            if (this.props.keyboard &&
                    (event.key === "Escape" ||
                     event.keyCode === 27)) {
                this.hide();
            }
        },

        componentDidMount: function() {
            window.addEventListener("keydown", this.listenKeyboard, true);
        },

        componentWillUnmount: function() {
            window.removeEventListener("keydown", this.listenKeyboard, true);
        },

    });

}

},{"react":undefined,"react-kit/transitionEvents":6}],"boron":[function(require,module,exports){
module.exports = {
    DropModal: require('./DropModal'),
    WaveModal: require('./WaveModal'),
    FlyModal: require('./FlyModal'),
    FadeModal: require('./FadeModal'),
    ScaleModal: require('./ScaleModal'),
    OutlineModal: require('./OutlineModal'),
}

},{"./DropModal":7,"./FadeModal":8,"./FlyModal":9,"./OutlineModal":10,"./ScaleModal":11,"./WaveModal":12}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2FwcGVuZFZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC1raXQvZ2V0VmVuZG9yUHJlZml4LmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LWtpdC9nZXRWZW5kb3JQcm9wZXJ0eU5hbWUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2luc2VydFJ1bGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L3RyYW5zaXRpb25FdmVudHMuanMiLCJzcmMvRHJvcE1vZGFsLmpzIiwic3JjL0ZhZGVNb2RhbC5qcyIsInNyYy9GbHlNb2RhbC5qcyIsInNyYy9PdXRsaW5lTW9kYWwuanMiLCJzcmMvU2NhbGVNb2RhbC5qcyIsInNyYy9XYXZlTW9kYWwuanMiLCJzcmMvbW9kYWxGYWN0b3J5LmpzIiwic3JjL0Jvcm9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRWZW5kb3JQcm9wZXJ0eU5hbWUgPSByZXF1aXJlKCcuL2dldFZlbmRvclByb3BlcnR5TmFtZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCwgc291cmNlcykge1xuICB2YXIgdG8gPSBPYmplY3QodGFyZ2V0KTtcbiAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICBmb3IgKHZhciBuZXh0SW5kZXggPSAxOyBuZXh0SW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBuZXh0SW5kZXgrKykge1xuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW25leHRJbmRleF07XG4gICAgaWYgKG5leHRTb3VyY2UgPT0gbnVsbCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIGZyb20gPSBPYmplY3QobmV4dFNvdXJjZSk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZhciBwcmVmaXhlZCA9IHt9O1xuICBmb3IgKHZhciBrZXkgaW4gdG8pIHtcbiAgICBwcmVmaXhlZFtnZXRWZW5kb3JQcm9wZXJ0eU5hbWUoa2V5KV0gPSB0b1trZXldXG4gIH1cblxuICByZXR1cm4gcHJlZml4ZWRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzc1ZlbmRvclByZWZpeDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxuICBpZiAoY3NzVmVuZG9yUHJlZml4KSByZXR1cm4gY3NzVmVuZG9yUHJlZml4O1xuXG4gIHZhciBzdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICcnKTtcbiAgdmFyIHByZSA9IChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChzdHlsZXMpLmpvaW4oJycpLm1hdGNoKC8tKG1venx3ZWJraXR8bXMpLS8pIHx8IChzdHlsZXMuT0xpbmsgPT09ICcnICYmIFsnJywgJ28nXSkpWzFdO1xuXG4gIHJldHVybiBjc3NWZW5kb3JQcmVmaXggPSAnLScgKyBwcmUgKyAnLSc7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbnZhciBwcmVmaXhlcyA9IFsnTW96JywgJ1dlYmtpdCcsICdPJywgJ21zJ107XG52YXIgZG9tVmVuZG9yUHJlZml4O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IHRoZSBwcm9wZXIgdmVuZG9yIHByb3BlcnR5IG5hbWUuICh0cmFuc2l0aW9uID0+IFdlYmtpdFRyYW5zaXRpb24pXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByb3ApIHtcblxuICBpZiAocHJvcCBpbiBkaXYuc3R5bGUpIHJldHVybiBwcm9wO1xuXG4gIHZhciBwcm9wID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc3Vic3RyKDEpO1xuICBpZiAoZG9tVmVuZG9yUHJlZml4KSB7XG4gICAgcmV0dXJuIGRvbVZlbmRvclByZWZpeCArIHByb3A7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHZlbmRvclByb3AgPSBwcmVmaXhlc1tpXSArIHByb3A7XG4gICAgICBpZiAodmVuZG9yUHJvcCBpbiBkaXYuc3R5bGUpIHtcbiAgICAgICAgZG9tVmVuZG9yUHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICAgIHJldHVybiB2ZW5kb3JQcm9wO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zZXJ0UnVsZSA9IHJlcXVpcmUoJy4vaW5zZXJ0UnVsZScpO1xudmFyIHZlbmRvclByZWZpeCA9IHJlcXVpcmUoJy4vZ2V0VmVuZG9yUHJlZml4JykoKTtcbnZhciBpbmRleCA9IDA7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oa2V5ZnJhbWVzKSB7XG4gIC8vIHJhbmRvbSBuYW1lXG4gIHZhciBuYW1lID0gJ2FuaW1fJyArICgrK2luZGV4KSArICgrbmV3IERhdGUpO1xuICB2YXIgY3NzID0gXCJAXCIgKyB2ZW5kb3JQcmVmaXggKyBcImtleWZyYW1lcyBcIiArIG5hbWUgKyBcIiB7XCI7XG5cbiAgZm9yICh2YXIga2V5IGluIGtleWZyYW1lcykge1xuICAgIGNzcyArPSBrZXkgKyBcIiB7XCI7XG5cbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBrZXlmcmFtZXNba2V5XSkge1xuICAgICAgdmFyIHBhcnQgPSBcIjpcIiArIGtleWZyYW1lc1trZXldW3Byb3BlcnR5XSArIFwiO1wiO1xuICAgICAgLy8gV2UgZG8gdmVuZG9yIHByZWZpeCBmb3IgZXZlcnkgcHJvcGVydHlcbiAgICAgIGNzcyArPSB2ZW5kb3JQcmVmaXggKyBwcm9wZXJ0eSArIHBhcnQ7XG4gICAgICBjc3MgKz0gcHJvcGVydHkgKyBwYXJ0O1xuICAgIH1cblxuICAgIGNzcyArPSBcIn1cIjtcbiAgfVxuXG4gIGNzcyArPSBcIn1cIjtcblxuICBpbnNlcnRSdWxlKGNzcyk7XG5cbiAgcmV0dXJuIG5hbWVcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGV4dHJhU2hlZXQ7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY3NzKSB7XG5cbiAgaWYgKCFleHRyYVNoZWV0KSB7XG4gICAgLy8gRmlyc3QgdGltZSwgY3JlYXRlIGFuIGV4dHJhIHN0eWxlc2hlZXQgZm9yIGFkZGluZyBydWxlc1xuICAgIGV4dHJhU2hlZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoZXh0cmFTaGVldCk7XG4gICAgLy8gS2VlcCByZWZlcmVuY2UgdG8gYWN0dWFsIFN0eWxlU2hlZXQgb2JqZWN0IChgc3R5bGVTaGVldGAgZm9yIElFIDwgOSlcbiAgICBleHRyYVNoZWV0ID0gZXh0cmFTaGVldC5zaGVldCB8fCBleHRyYVNoZWV0LnN0eWxlU2hlZXQ7XG4gIH1cblxuICB2YXIgaW5kZXggPSAoZXh0cmFTaGVldC5jc3NSdWxlcyB8fCBleHRyYVNoZWV0LnJ1bGVzKS5sZW5ndGg7XG4gIGV4dHJhU2hlZXQuaW5zZXJ0UnVsZShjc3MsIGluZGV4KTtcblxuICByZXR1cm4gZXh0cmFTaGVldDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBFVkVOVF9OQU1FX01BUCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGljaCBldmVudCBmaXJlZCB3aGVuIGFcbiAqIHRyYW5zaXRpb24vYW5pbWF0aW9uIGVuZHMsIGJhc2VkIG9uIHRoZSBzdHlsZSBwcm9wZXJ0eSB1c2VkIHRvXG4gKiBkZWZpbmUgdGhhdCBldmVudC5cbiAqL1xudmFyIEVWRU5UX05BTUVfTUFQID0ge1xuICB0cmFuc2l0aW9uZW5kOiB7XG4gICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgJ01velRyYW5zaXRpb24nOiAnbW96VHJhbnNpdGlvbkVuZCcsXG4gICAgJ09UcmFuc2l0aW9uJzogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICAnbXNUcmFuc2l0aW9uJzogJ01TVHJhbnNpdGlvbkVuZCdcbiAgfSxcblxuICBhbmltYXRpb25lbmQ6IHtcbiAgICAnYW5pbWF0aW9uJzogJ2FuaW1hdGlvbmVuZCcsXG4gICAgJ1dlYmtpdEFuaW1hdGlvbic6ICd3ZWJraXRBbmltYXRpb25FbmQnLFxuICAgICdNb3pBbmltYXRpb24nOiAnbW96QW5pbWF0aW9uRW5kJyxcbiAgICAnT0FuaW1hdGlvbic6ICdvQW5pbWF0aW9uRW5kJyxcbiAgICAnbXNBbmltYXRpb24nOiAnTVNBbmltYXRpb25FbmQnXG4gIH1cbn07XG5cbnZhciBlbmRFdmVudHMgPSBbXTtcblxuZnVuY3Rpb24gZGV0ZWN0RXZlbnRzKCkge1xuICB2YXIgdGVzdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzdHlsZSA9IHRlc3RFbC5zdHlsZTtcblxuICAvLyBPbiBzb21lIHBsYXRmb3JtcywgaW4gcGFydGljdWxhciBzb21lIHJlbGVhc2VzIG9mIEFuZHJvaWQgNC54LFxuICAvLyB0aGUgdW4tcHJlZml4ZWQgXCJhbmltYXRpb25cIiBhbmQgXCJ0cmFuc2l0aW9uXCIgcHJvcGVydGllcyBhcmUgZGVmaW5lZCBvbiB0aGVcbiAgLy8gc3R5bGUgb2JqZWN0IGJ1dCB0aGUgZXZlbnRzIHRoYXQgZmlyZSB3aWxsIHN0aWxsIGJlIHByZWZpeGVkLCBzbyB3ZSBuZWVkXG4gIC8vIHRvIGNoZWNrIGlmIHRoZSB1bi1wcmVmaXhlZCBldmVudHMgYXJlIHVzZWFibGUsIGFuZCBpZiBub3QgcmVtb3ZlIHRoZW1cbiAgLy8gZnJvbSB0aGUgbWFwXG4gIGlmICghKCdBbmltYXRpb25FdmVudCcgaW4gd2luZG93KSkge1xuICAgIGRlbGV0ZSBFVkVOVF9OQU1FX01BUC5hbmltYXRpb25lbmQuYW5pbWF0aW9uO1xuICB9XG5cbiAgaWYgKCEoJ1RyYW5zaXRpb25FdmVudCcgaW4gd2luZG93KSkge1xuICAgIGRlbGV0ZSBFVkVOVF9OQU1FX01BUC50cmFuc2l0aW9uZW5kLnRyYW5zaXRpb247XG4gIH1cblxuICBmb3IgKHZhciBiYXNlRXZlbnROYW1lIGluIEVWRU5UX05BTUVfTUFQKSB7XG4gICAgdmFyIGJhc2VFdmVudHMgPSBFVkVOVF9OQU1FX01BUFtiYXNlRXZlbnROYW1lXTtcbiAgICBmb3IgKHZhciBzdHlsZU5hbWUgaW4gYmFzZUV2ZW50cykge1xuICAgICAgaWYgKHN0eWxlTmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBlbmRFdmVudHMucHVzaChiYXNlRXZlbnRzW3N0eWxlTmFtZV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIGRldGVjdEV2ZW50cygpO1xufVxuXG5cbi8vIFdlIHVzZSB0aGUgcmF3IHthZGR8cmVtb3ZlfUV2ZW50TGlzdGVuZXIoKSBjYWxsIGJlY2F1c2UgRXZlbnRMaXN0ZW5lclxuLy8gZG9lcyBub3Qga25vdyBob3cgdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVycyBhbmQgd2UgcmVhbGx5IHNob3VsZFxuLy8gY2xlYW4gdXAuIEFsc28sIHRoZXNlIGV2ZW50cyBhcmUgbm90IHRyaWdnZXJlZCBpbiBvbGRlciBicm93c2Vyc1xuLy8gc28gd2Ugc2hvdWxkIGJlIEEtT0sgaGVyZS5cblxuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lcikge1xuICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCBmYWxzZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIElmIENTUyB0cmFuc2l0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCwgdHJpZ2dlciBhbiBcImVuZCBhbmltYXRpb25cIlxuICAgICAgLy8gZXZlbnQgaW1tZWRpYXRlbHkuXG4gICAgICB3aW5kb3cuc2V0VGltZW91dChldmVudExpc3RlbmVyLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIHJlbW92ZUVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbn07XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjcsMCwwLjMsMSknXG4gICAgfSxcblxuICAgIGhpZGU6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjRzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdjdWJpYy1iZXppZXIoMC43LDAsMC4zLDEpJ1xuICAgIH0sXG5cbiAgICBzaG93TW9kYWxBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgLTMwMHB4LCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMCknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVNb2RhbEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgMTAwcHgsIDApJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBzaG93QmFja2Ryb3BBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgLTIwcHgsIDApJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgwLCAwLCAwKSdcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgaGlkZUNvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDUwcHgsIDApJ1xuICAgICAgICB9XG4gICAgfSlcbn07XG5cbnZhciBzaG93QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3c7XG52YXIgaGlkZUFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlO1xudmFyIHNob3dNb2RhbEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93TW9kYWxBbmltYXRpb247XG52YXIgaGlkZU1vZGFsQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVNb2RhbEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdtb2RhbCc7XG4gICAgfSxcbiAgICBnZXRNb2RhbFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjUwMHB4XCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMClcIixcbiAgICAgICAgICAgIHRvcDogXCI1MCVcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwid2hpdGVcIixcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVNb2RhbEFuaW1hdGlvbiA6IHNob3dNb2RhbEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EZWxheTogJzAuMjVzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuXG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2hvd0JhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgaGlkZUJhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbnZhciBzaG93QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3c7XG52YXIgaGlkZUFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlO1xudmFyIHNob3dDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dDb250ZW50QW5pbWF0aW9uO1xudmFyIGhpZGVDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVDb250ZW50QW5pbWF0aW9uO1xudmFyIHNob3dCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93QmFja2Ryb3BBbmltYXRpb247XG52YXIgaGlkZUJhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVCYWNrZHJvcEFuaW1hdGlvbjtcblxubW9kdWxlLmV4cG9ydHMgPSBtb2RhbEZhY3Rvcnkoe1xuICAgIGdldFJlZjogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gJ2NvbnRlbnQnO1xuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApXCIsXG4gICAgICAgICAgICB0b3A6IFwiNTAlXCIsXG4gICAgICAgICAgICBsZWZ0OiBcIjUwJVwiXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC4zcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQ29udGVudEFuaW1hdGlvbiA6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNXMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNXMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuXG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZChjYWxjKC0xMDB2dyAtIDUwJSksIDAsIDApJ1xuICAgICAgICB9LFxuICAgICAgICAnNTAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDEwMHB4LCAwLCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcblxuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICc1MCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTEwMHB4LCAwLCAwKSBzY2FsZTNkKDEuMSwgMS4xLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoY2FsYygxMDB2dyArIDUwJSksIDAsIDApJ1xuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgc2hvd0JhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgaGlkZUJhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgICc5MCUnOiB7XG4gICAgICAgICAgICBvcGFjdGl5OiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxudmFyIHNob3dBbmltYXRpb24gPSBhbmltYXRpb24uc2hvdztcbnZhciBoaWRlQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGU7XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG52YXIgc2hvd0JhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dCYWNrZHJvcEFuaW1hdGlvbjtcbnZhciBoaWRlQmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUJhY2tkcm9wQW5pbWF0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsRmFjdG9yeSh7XG4gICAgZ2V0UmVmOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiAnY29udGVudCc7XG4gICAgfSxcbiAgICBnZXRNb2RhbFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgekluZGV4OiAxMDUwLFxuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjUwMHB4XCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMClcIixcbiAgICAgICAgICAgIHRvcDogXCI1MCVcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCJcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIGdldEJhY2tkcm9wU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgekluZGV4OiAxMDQwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMzNzNBNDdcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjNzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQmFja2Ryb3BBbmltYXRpb24gOiBzaG93QmFja2Ryb3BBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRDb250ZW50U3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVDb250ZW50QW5pbWF0aW9uIDogc2hvd0NvbnRlbnRBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSlcbiAgICB9XG59KTtcbiIsInZhciBtb2RhbEZhY3RvcnkgPSByZXF1aXJlKCcuL21vZGFsRmFjdG9yeScpO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIGluc2VydEtleWZyYW1lc1J1bGUgPSByZXF1aXJlKCdyZWFjdC1raXQvaW5zZXJ0S2V5ZnJhbWVzUnVsZScpO1xudmFyIGFwcGVuZFZlbmRvclByZWZpeCA9IHJlcXVpcmUoJ3JlYWN0LWtpdC9hcHBlbmRWZW5kb3JQcmVmaXgnKTtcblxudmFyIGFuaW1hdGlvbiA9IHtcbiAgICBzaG93OiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC44cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnY3ViaWMtYmV6aWVyKDAuNiwwLDAuNCwxKSdcbiAgICB9LFxuICAgIGhpZGU6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjRzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdlYXNlLW91dCdcbiAgICB9LFxuICAgIHNob3dDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgfSxcbiAgICAgICAgJzQwJSc6e1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldFNoYXJwOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHZhciBzdHJva2VEYXNoTGVuZ3RoID0gMTY4MDtcblxuICAgICAgICB2YXIgc2hvd1NoYXJwQW5pbWF0aW9uID0gaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICAgICAgJ3N0cm9rZS1kYXNob2Zmc2V0Jzogc3Ryb2tlRGFzaExlbmd0aFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgICAgICdzdHJva2UtZGFzaG9mZnNldCc6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdmFyIHNoYXJwU3R5bGUgPSB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHdpZHRoOiAnY2FsYygxMDAlKScsXG4gICAgICAgICAgICBoZWlnaHQ6ICdjYWxjKDEwMCUpJyxcbiAgICAgICAgICAgIHpJbmRleDogJy0xJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZWN0U3R5bGUgPSBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IHdpbGxIaWRkZW4/ICcwLjRzJyA6JzAuOHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuPyBoaWRlQ29udGVudEFuaW1hdGlvbjogc2hvd1NoYXJwQW5pbWF0aW9uLFxuICAgICAgICAgICAgc3Ryb2tlOiAnI2ZmZmZmZicsXG4gICAgICAgICAgICBzdHJva2VXaWR0aDogJzJweCcsXG4gICAgICAgICAgICBzdHJva2VEYXNoYXJyYXk6IHN0cm9rZURhc2hMZW5ndGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge3N0eWxlOiBzaGFycFN0eWxlfSwgXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3ZnXCIsIHtcbiAgICAgICAgICAgICAgICB4bWxuczogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcbiAgICAgICAgICAgICAgICB3aWR0aDogXCIxMDAlXCIsIFxuICAgICAgICAgICAgICAgIGhlaWdodDogXCIxMDAlXCIsIFxuICAgICAgICAgICAgICAgIHZpZXdCb3g6IFwiMCAwIDQ5NiAxMzZcIiwgXG4gICAgICAgICAgICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogXCJub25lXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicmVjdFwiLCB7c3R5bGU6IHJlY3RTdHlsZSwgXG4gICAgICAgICAgICAgICAgICAgIHg6IFwiMlwiLCBcbiAgICAgICAgICAgICAgICAgICAgeTogXCIyXCIsIFxuICAgICAgICAgICAgICAgICAgICBmaWxsOiBcIm5vbmVcIiwgXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBcIjQ5MlwiLCBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBcIjEzMlwifSlcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApXCIsXG4gICAgICAgICAgICB0b3A6IFwiNTAlXCIsXG4gICAgICAgICAgICBsZWZ0OiBcIjUwJVwiXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQ29udGVudEFuaW1hdGlvbiA6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjYsMCwwLjQsMSknXG4gICAgfSxcbiAgICBoaWRlOiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnZWFzZS1vdXQnXG4gICAgfSxcbiAgICBzaG93Q29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDEsIDEsIDEpJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnc2NhbGUzZCgwLjUsIDAuNSwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIG1vZGFsRmFjdG9yeSA9IHJlcXVpcmUoJy4vbW9kYWxGYWN0b3J5Jyk7XG52YXIgaW5zZXJ0S2V5ZnJhbWVzUnVsZSA9IHJlcXVpcmUoJ3JlYWN0LWtpdC9pbnNlcnRLZXlmcmFtZXNSdWxlJyk7XG52YXIgYXBwZW5kVmVuZG9yUHJlZml4ID0gcmVxdWlyZSgncmVhY3Qta2l0L2FwcGVuZFZlbmRvclByZWZpeCcpO1xuXG52YXIgYW5pbWF0aW9uID0ge1xuICAgIHNob3c6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcxcycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnbGluZWFyJ1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43LCAwLCAwLCAwLCAwLCAwLjcsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMi4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43NTI2NiwgMCwgMCwgMCwgMCwgMC43NjM0MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjgxMDcxLCAwLCAwLCAwLCAwLCAwLjg0NTQ1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzYuMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC44NjgwOCwgMCwgMCwgMCwgMCwgMC45Mjg2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzguMzMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTIwMzgsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAuNDE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTY0ODIsIDAsIDAsIDAsIDAsIDEuMDUyMDIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTIuNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLCAwLCAwLCAwLCAwLCAxLjA4MjA0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE0LjU4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAyNTYzLCAwLCAwLCAwLCAwLCAxLjA5MTQ5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE2LjY2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjA0MjI3LCAwLCAwLCAwLCAwLCAxLjA4NDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE4Ljc1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUxMDIsIDAsIDAsIDAsIDAsIDEuMDY2NjYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjAuODMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUzMzQsIDAsIDAsIDAsIDAsIDEuMDQzNTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjIuOTE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUwNzgsIDAsIDAsIDAsIDAsIDEuMDIwMTIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wNDQ4NywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyNy4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMzY5OSwgMCwgMCwgMCwgMCwgMC45ODUzNCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyOS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMjgzMSwgMCwgMCwgMCwgMCwgMC45NzY4OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczMS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxOTczLCAwLCAwLCAwLCAwLCAwLjk3NDIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzMzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxMTkxLCAwLCAwLCAwLCAwLCAwLjk3NjE4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwNTI2LCAwLCAwLCAwLCAwLCAwLjk4MTIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMC45ODc3MywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczOS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTYxNywgMCwgMCwgMCwgMCwgMC45OTQzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTM2OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjM3LCAwLCAwLCAwLCAwLCAxLjAwNDEzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjAyLCAwLCAwLCAwLCAwLCAxLjAwNjUxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjQxLCAwLCAwLCAwLCAwLCAxLjAwNzI2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MzI5LCAwLCAwLCAwLCAwLCAxLjAwNjcxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUyLjA4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NDQ3LCAwLCAwLCAwLCAwLCAxLjAwNTI5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NTc3LCAwLCAwLCAwLCAwLCAxLjAwMzQ2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU2LjI1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTk3MDUsIDAsIDAsIDAsIDAsIDEuMDAxNiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc1OC4zMzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTgyMiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2MC40MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTkyMSwgMCwgMCwgMCwgMCwgMC45OTg4NCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2Mi41JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEsIDAsIDAsIDAsIDAsIDAuOTk4MTYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjQuNTgzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwNTcsIDAsIDAsIDAsIDAsIDAuOTk3OTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjYuNjY2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwOTUsIDAsIDAsIDAsIDAsIDAuOTk4MTEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjguNzUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTg1MSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3MC44MzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExOSwgMCwgMCwgMCwgMCwgMC45OTkwMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Mi45MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTk1NSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Ny4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA4MywgMCwgMCwgMCwgMCwgMS4wMDAzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3OS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA2MywgMCwgMCwgMCwgMCwgMS4wMDA1MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4MS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDQ0LCAwLCAwLCAwLCAwLCAxLjAwMDU4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzgzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDI3LCAwLCAwLCAwLCAwLCAxLjAwMDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDEyLCAwLCAwLCAwLCAwLCAxLjAwMDQyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMS4wMDAyNywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4OS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk5MSwgMCwgMCwgMCwgMCwgMS4wMDAxMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk4NiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTkxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgyLCAwLCAwLCAwLCAwLCAwLjk5OTg1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTg0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAuOCwgMC44LCAxKSdcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciB0cmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgncmVhY3Qta2l0L3RyYW5zaXRpb25FdmVudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhbmltYXRpb24pe1xuXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICAgICAgcHJvcFR5cGVzOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAvLyBDbG9zZSB0aGUgbW9kYWwgd2hlbiBlc2MgaXMgcHJlc3NlZD8gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgICAgICAgIGtleWJvYXJkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgICAgIG9uU2hvdzogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgICAgICBvbkhpZGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgICAgICAgICAgYW5pbWF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICAgICAgYmFja2Ryb3A6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgICAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgICAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgICAgICAgICAgIF0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcIlwiLFxuICAgICAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24oKXt9LFxuICAgICAgICAgICAgICAgIG9uSGlkZTogZnVuY3Rpb24oKXt9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogYW5pbWF0aW9uLFxuICAgICAgICAgICAgICAgIGtleWJvYXJkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lsbEhpZGRlbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFzSGlkZGVuOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuaGlkZGVuO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJlZiA9IHRoaXMucHJvcHMuYW5pbWF0aW9uLmdldFJlZigpO1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCk7XG4gICAgICAgICAgICB2YXIgZW5kTGlzdGVuZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUgJiYgZS50YXJnZXQgIT09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uRXZlbnRzLnJlbW92ZUVuZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW50ZXIoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKG5vZGUsIGVuZExpc3RlbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgaGlkZGVuID0gdGhpcy5oYXNIaWRkZW4oKTtcbiAgICAgICAgICAgIGlmKGhpZGRlbikgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIHZhciB3aWxsSGlkZGVuID0gdGhpcy5zdGF0ZS53aWxsSGlkZGVuO1xuICAgICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IHRoaXMucHJvcHMuYW5pbWF0aW9uO1xuICAgICAgICAgICAgdmFyIG1vZGFsU3R5bGUgPSBhbmltYXRpb24uZ2V0TW9kYWxTdHlsZSh3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciBiYWNrZHJvcFN0eWxlID0gYW5pbWF0aW9uLmdldEJhY2tkcm9wU3R5bGUod2lsbEhpZGRlbik7XG4gICAgICAgICAgICB2YXIgY29udGVudFN0eWxlID0gYW5pbWF0aW9uLmdldENvbnRlbnRTdHlsZSh3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciByZWYgPSBhbmltYXRpb24uZ2V0UmVmKHdpbGxIaWRkZW4pO1xuICAgICAgICAgICAgdmFyIHNoYXJwID0gYW5pbWF0aW9uLmdldFNoYXJwICYmIGFuaW1hdGlvbi5nZXRTaGFycCh3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciBiYWNrZHJvcCA9IHRoaXMucHJvcHMuYmFja2Ryb3A/IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge29uQ2xpY2s6IHRoaXMuaGlkZSwgc3R5bGU6IGJhY2tkcm9wU3R5bGV9KTogdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBpZih3aWxsSGlkZGVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnJlZnNbcmVmXS5nZXRET01Ob2RlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZExpc3RlbmVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZSAmJiBlLnRhcmdldCAhPT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbkV2ZW50cy5yZW1vdmVFbmRFdmVudExpc3RlbmVyKG5vZGUsIGVuZExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWF2ZSgpO1xuXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRMaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChcInNwYW5cIiwgbnVsbCwgXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7cmVmOiBcIm1vZGFsXCIsIHN0eWxlOiBtb2RhbFN0eWxlLCBjbGFzc05hbWU6IHRoaXMucHJvcHMuY2xhc3NOYW1lfSwgXG4gICAgICAgICAgICAgICAgICAgIHNoYXJwLCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7cmVmOiBcImNvbnRlbnRcIiwgdGFiSW5kZXg6IFwiLTFcIiwgc3R5bGU6IGNvbnRlbnRTdHlsZX0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKSwgXG4gICAgICAgICAgICAgICAgYmFja2Ryb3BcbiAgICAgICAgICAgICApKVxuICAgICAgICAgICAgO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25IaWRlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW50ZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uU2hvdygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZighdGhpcy5oYXNIaWRkZW4oKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB3aWxsSGlkZGVuOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBoaWRkZW46IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYodGhpcy5oYXNIaWRkZW4oKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB3aWxsSGlkZGVuOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZih0aGlzLmhhc0hpZGRlbigpKVxuICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxpc3RlbktleWJvYXJkOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMua2V5Ym9hcmQgJiZcbiAgICAgICAgICAgICAgICAgICAgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgZXZlbnQua2V5Q29kZSA9PT0gMjcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMubGlzdGVuS2V5Ym9hcmQsIHRydWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmxpc3RlbktleWJvYXJkLCB0cnVlKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBEcm9wTW9kYWw6IHJlcXVpcmUoJy4vRHJvcE1vZGFsJyksXG4gICAgV2F2ZU1vZGFsOiByZXF1aXJlKCcuL1dhdmVNb2RhbCcpLFxuICAgIEZseU1vZGFsOiByZXF1aXJlKCcuL0ZseU1vZGFsJyksXG4gICAgRmFkZU1vZGFsOiByZXF1aXJlKCcuL0ZhZGVNb2RhbCcpLFxuICAgIFNjYWxlTW9kYWw6IHJlcXVpcmUoJy4vU2NhbGVNb2RhbCcpLFxuICAgIE91dGxpbmVNb2RhbDogcmVxdWlyZSgnLi9PdXRsaW5lTW9kYWwnKSxcbn1cbiJdfQ==
