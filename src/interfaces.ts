export interface Point {
  column:number;
  row:number;
}

export interface File {
  path:string;
}

export interface AutocompleteSuggest {
  text:string;
  displayText:string;
  rightLabelHTML:string;
}

export interface SuggestionParams {
  editor:any;
  bufferPosition:Point;
}

export interface FilterResult {
  string:string;
}
