declare namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          ref?: React.RefObject<HTMLInputElement>;
          class?: string;
          placeholder?: string;
          value?: string;
        },
        HTMLElement
      >;
    }
  }