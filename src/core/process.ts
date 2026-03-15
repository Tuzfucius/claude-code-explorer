import { execFile, spawn } from "node:child_process";
import os from "node:os";

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export function execFileText(command: string, args: string[], cwd: string, timeout = 15000): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer = setTimeout(async () => {
      if (settled) {
        return;
      }

      settled = true;
      await terminateProcessTree(child.pid);
      reject(new Error(stderr || stdout || `Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    child.on("error", async (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      await terminateProcessTree(child.pid);
      reject(new Error(stderr || stdout || error.message));
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Command exited with code ${code}: ${command}`));
        return;
      }

      resolve({
        stdout,
        stderr,
      });
    });
  });
}

async function terminateProcessTree(pid: number | undefined): Promise<void> {
  if (!pid) {
    return;
  }

  if (os.platform() === "win32") {
    await new Promise<void>((resolve) => {
      execFile("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => resolve());
    });
    return;
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // ignore
  }
}
