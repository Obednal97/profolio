// TypeScript 7 requires a declaration for side-effect stylesheet imports such
// as `import "../styles/main.css"` in app/layout.tsx. Earlier versions let
// these resolve implicitly; 7 reports TS2882 without this.
declare module "*.css";
declare module "*.scss";

// CSS Modules keep a typed shape, since consumers read class names off them.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
