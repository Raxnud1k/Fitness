module.exports = ({ config }) => {
  const basePath = process.env.FITNESS_WEB_BASE_PATH;
  if (basePath && !/^\/[a-zA-Z0-9/_-]*$/.test(basePath)) {
    throw new Error('FITNESS_WEB_BASE_PATH must be a URL path such as /Fitness');
  }
  return {
    ...config,
    experiments: { ...config.experiments, ...(basePath ? { baseUrl: basePath.replace(/\/$/, '') } : {}) },
  };
};
