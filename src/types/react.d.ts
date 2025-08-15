declare module 'react' {
  const React: any;
  export = React;
  export as namespace React;
}

declare module 'react-dom' {
  const ReactDOM: any;
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}