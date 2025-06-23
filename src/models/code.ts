export interface CodeFunction {
  name: string;
  size: number;
  startLine: number;
  endLine: number;
}

export interface FileData {
  functions: CodeFunction[];
  filename: string;
}
