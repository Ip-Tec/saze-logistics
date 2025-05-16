import React from 'react';

export const PlaceAutocomplete = React.forwardRef<
  HTMLInputElement,
  React.HTMLAttributes<HTMLInputElement> & {
    placeholder?: string;
    value?: string;
  }
>((props, ref) => {
  return <gmp-place-autocomplete ref={ref} {...props} />;
});

PlaceAutocomplete.displayName = 'PlaceAutocomplete';