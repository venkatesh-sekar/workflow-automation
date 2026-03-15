declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.styl' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module 'html-to-image' {
  export function toPng(
    node: HTMLElement,
    options?: {
      backgroundColor?: string;
      pixelRatio?: number;
      [key: string]: unknown;
    },
  ): Promise<string>;
  export function toJpeg(
    node: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<string>;
  export function toSvg(
    node: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<string>;
}

declare module 'ee-embed-sdk' {
  export interface FlowClientInit {
    type: FlowClientEventName.CLIENT_INIT;
    data: Record<string, never>;
  }
  export interface FlowClientAuthenticationSuccess {
    type: FlowClientEventName.CLIENT_AUTHENTICATION_SUCCESS;
    data: Record<string, never>;
  }
  export interface FlowClientAuthenticationFailed {
    type: FlowClientEventName.CLIENT_AUTHENTICATION_FAILED;
    data: unknown;
  }
  export interface FlowClientConfigurationFinished {
    type: FlowClientEventName.CLIENT_CONFIGURATION_FINISHED;
    data: Record<string, never>;
  }
  export interface FlowClientShowConnectionIframe {
    type: FlowClientEventName.CLIENT_SHOW_CONNECTION_IFRAME;
    data: Record<string, unknown>;
  }
  export interface FlowNewConnectionDialogClosed {
    type: FlowClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED;
    data: {
      connection?: { id: string; name: string };
    };
  }
  export interface FlowClientConnectionNameIsInvalid {
    type: FlowClientEventName.CLIENT_CONNECTION_NAME_IS_INVALID;
    data: {
      error: string;
    };
  }
  export interface FlowClientConnectionPieceNotFound {
    type: FlowClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND;
    data: {
      error: string;
    };
  }
  export interface FlowVendorInit {
    type: FlowVendorEventName.VENDOR_INIT;
    data: {
      jwtToken?: string;
      mode?: string;
      locale?: string;
      initialRoute?: string;
      hideSidebar?: boolean;
      hideFlowNameInBuilder?: boolean;
      disableNavigationInBuilder?: boolean | 'keep_home_button_only';
      hideFolders?: boolean;
      sdkVersion?: string;
      fontUrl?: string;
      fontFamily?: string;
      hideExportAndImportFlow?: boolean;
      emitHomeButtonClickedEvent?: boolean;
      homeButtonIcon?: string;
      hideDuplicateFlow?: boolean;
      hideFlowsPageNavbar?: boolean;
      hidePageHeader?: boolean;
    };
  }
  export interface FlowVendorRouteChanged {
    type: FlowVendorEventName.VENDOR_ROUTE_CHANGED;
    data: {
      vendorRoute: string;
    };
  }
  export enum FlowClientEventName {
    CLIENT_INIT = 'CLIENT_INIT',
    CLIENT_AUTHENTICATION_SUCCESS = 'CLIENT_AUTHENTICATION_SUCCESS',
    CLIENT_AUTHENTICATION_FAILED = 'CLIENT_AUTHENTICATION_FAILED',
    CLIENT_CONFIGURATION_FINISHED = 'CLIENT_CONFIGURATION_FINISHED',
    CLIENT_ROUTE_CHANGED = 'CLIENT_ROUTE_CHANGED',
    CLIENT_SHOW_CONNECTION_IFRAME = 'CLIENT_SHOW_CONNECTION_IFRAME',
    CLIENT_NEW_CONNECTION_DIALOG_CLOSED = 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED',
    CLIENT_CONNECTION_NAME_IS_INVALID = 'CLIENT_CONNECTION_NAME_IS_INVALID',
    CLIENT_CONNECTION_PIECE_NOT_FOUND = 'CLIENT_CONNECTION_PIECE_NOT_FOUND',
  }
  export enum FlowVendorEventName {
    VENDOR_INIT = 'VENDOR_INIT',
    VENDOR_ROUTE_CHANGED = 'VENDOR_ROUTE_CHANGED',
  }
  export const NEW_CONNECTION_QUERY_PARAMS: {
    name: string;
    pieceName: string;
    connectionName: string;
    randomId: string;
  };
}
