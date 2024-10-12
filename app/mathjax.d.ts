declare module "mathjax/es5/tex-svg" {
  const MathJax: {
    typesetPromise: (elements: HTMLElement[]) => Promise<void>;
    startup: {
      promise: Promise<void>;
    };
  };
  export = MathJax;
}
