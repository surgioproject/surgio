import packageJson from './package.json' with { type: 'json' }

const getPackage = () => packageJson

export default getPackage
export { getPackage as 'module.exports' }
