import { execFile } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export function execFileText(command: string, args: string[], cwd: string, timeout = 15000): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }

      resolve({
        stdout: stdout ?? "",
        stderr: stderr ?? "",
      });
    });
  });
}
