<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@remirror/core-helpers](./core-helpers.md) &gt; [isInstanceOf](./core-helpers.isinstanceof.md)

## isInstanceOf variable

A shorthand method for creating instance of checks.

<b>Signature:</b>

```typescript
isInstanceOf: <GConstructor extends AnyConstructor<unknown>>(Constructor: GConstructor) => (value: unknown) => value is InstanceType<GConstructor>
```