module.exports = {
  apps: [
    {
      name: "beyond-brawn",

      script: "npm",

      args: "start",

      cwd: "/root/beyond-brawn/frontend",

      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
