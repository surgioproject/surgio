type Package = {
  name: string
  version: string
}

declare function getPackage(): Package

export default getPackage
export { getPackage as 'module.exports' }
