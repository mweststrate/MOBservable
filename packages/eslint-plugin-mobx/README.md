# eslint-plugin-mobx

Mobx specific linting rules for `eslint`.

## Installation

```
npm install --save-dev eslint @typescript-eslint/parser eslint-plugin-mobx 
```

## Configuration

```javascript
// .eslintrc.js
module.exports = {
    parser: "@typescript-eslint/parser",
    // Include "mobx" in plugins array:
    plugins: ["mobx"],        
    // Either extend our recommended configuration:
    extends: "plugin:mobx/recommended",
    // ...or specify and customize individual rules:
    rules: {
      // these values are the same as recommended
      'mobx/exhaustive-make-observable': 'warn',      
      'mobx/missing-make-observable': 'error',
      'mobx/unconditional-make-observable': 'error',      
    },
};
```

## Rules

### mobx/exhaustive-make-observable

Makes sure that `makeObservable` annotates all fields defined on class or object literal.<br>
Autofix adds `field: true` for each missing field.<br>
To exclude a field, annotate it using `field: false`.<br>
Does not support fields introduced by constructor (`this.foo = 5`).<br>
Does not warn about annotated non-existing fields (there is a runtime check, but the autofix removing the field could be handy...).

### mobx/missing-make-observable

*When using decorators (eg `@observable foo = 5`)*, makes sure that `makeObservable(this)` is called in a constructor.<br>
Autofix creates a constructor if necessary and adds `makeObservable(this)` at it's end.

### mobx/unconditional-make-observable

Makes sure the `make(Auto)Observable(this)` is called unconditionally inside a constructor.

### mobx/missing-observer
Makes sure every React component is wrapped with `observer`. A React component is considered to be any *class* extending from `Component` or `React.Component` and any *function* which name has first letter capitalized (for anonymous functions the name is inferred from variable). These are all considered components:
```javascript
class Cmp extends React.Component { }
class Cmp extends Component { }
const Cmp = class extends React.Component { }
const Cmp = class extends Component { }
class extends Component { }
class extends React.Component { }

function Named() { }
const foo = function Named() { }
const Anonym = function () { };
const Arrow = () => { };
```
Autofix wraps the component with `observer` and if necessary declares a constant of the same name: `const Name = observer(function Name() {})`.
Highly suggested, but not part of the recommended, because it's a bit opinionated and can lead to a lot of false positives depending on your conventions. You will probably want to combine this rule with `overrides` option, eg:
```javascript
// .eslintrc.js
"overrides": [
  {
    "files": ["*.jsx"],
    "rules": {
      "mobx/missing-observer": "error"
    }
  }
]
```