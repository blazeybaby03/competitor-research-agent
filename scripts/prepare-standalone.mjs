import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function copyIfPresent(source, destination) {
  if (!(await exists(source))) return;

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
  console.log(`Copied ${path.relative(root, source)} to ${path.relative(root, destination)}`);
}

await copyIfPresent(
  path.join(root, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);

await copyIfPresent(path.join(root, "public"), path.join(standaloneRoot, "public"));
