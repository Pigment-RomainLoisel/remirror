<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@remirror/core-types](./core-types.md) &gt; [ActionMethod](./core-types.actionmethod.md) &gt; [isEnabled](./core-types.actionmethod.isenabled.md)

## ActionMethod.isEnabled() method

Returns true when the command can be run and false when it can't be run.

<b>Signature:</b>

```typescript
isEnabled(attrs?: Attrs): boolean;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  attrs | <code>Attrs</code> | certain commands require attrs to run |

<b>Returns:</b>

`boolean`

## Remarks

Some commands can have rules and restrictions. For example you may want to disable styling making text bold when within a codeBlock. In that case isEnabled would be false when within the codeBlock and true when outside.
