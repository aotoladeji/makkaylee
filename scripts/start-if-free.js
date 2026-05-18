const net = require("net");
const { spawn } = require("child_process");

const [, , portArg, ...commandParts] = process.argv;
const port = Number(portArg);
const command = commandParts.join(" ").trim();

if (!Number.isInteger(port) || !command) {
  console.error("Usage: node scripts/start-if-free.js <port> <command>");
  process.exit(1);
}

function isPortOpen(targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: targetPort });

    socket.setTimeout(1000);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      resolve(false);
    });
  });
}

async function main() {
  const portInUse = await isPortOpen(port);

  if (portInUse) {
    console.log(`Port ${port} is already in use. Skipping: ${command}`);
    return;
  }

  const child = spawn(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  child.once("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
