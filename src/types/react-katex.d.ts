declare module "react-katex" {
  import * as React from "react";

  export interface KatexProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    trust?: boolean | ((context: any) => boolean);
    strict?: boolean | string | ((errorCode: string, errorMsg: string, token?: any) => boolean | string);
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}
