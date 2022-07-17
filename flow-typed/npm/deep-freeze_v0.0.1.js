// flow-typed signature: eb61173a8bf860d5fdf5447b6b1352cc
// flow-typed version: 3793c65651/deep-freeze_v0.0.1/flow_>=v0.104.x

declare module 'deep-freeze' {
  declare type deepFreezeFnType = {|
    <T>(a: $ReadOnlyArray<T>): $ReadOnlyArray<DeepReadOnly<T>>,
    <T>(a: T[]): $ReadOnlyArray<DeepReadOnly<T>>,
    <T: boolean|string|number>(p: T): T,
    <T>(o: T): $ReadOnly<
      $ObjMapi<T, <P>(P) => DeepReadOnly<$ElementType<T, P>>>
    >,
    <T: Function>(f: T): T,
  |};

  declare export type DeepReadOnly<T> = $Call<deepFreezeFnType, T>

  declare module.exports: deepFreezeFnType;

}
