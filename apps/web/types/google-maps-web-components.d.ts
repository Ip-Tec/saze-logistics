declare namespace google.maps.places.web {
  class PlaceAutocompleteElement extends HTMLElement {
    value: string;
    placeholder: string;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gmp-place-autocomplete': google.maps.places.web.PlaceAutocompleteElement;
  }
} 