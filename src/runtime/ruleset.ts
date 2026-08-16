export const addProxyToRuleSet = (
  source: string,
  proxyName?: string,
): string => {
  if (!proxyName) throw new Error('必须为片段指定一个策略')
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  return source
    .split(eol)
    .map((line) => {
      if (!line.trim() || /^\s*(?:#|\/\/)/.test(line)) return line
      const rule = line.split(',')
      switch (rule[0].trim().toUpperCase()) {
        case 'URL-REGEX':
        case 'AND':
        case 'OR':
        case 'NOT':
          return `${line},${proxyName}`
        case 'IP-CIDR':
        case 'IP-CIDR6':
        case 'IP-ASN':
        case 'GEOIP':
          rule.splice(2, 0, proxyName)
          return rule.join(',')
        default: {
          const last = rule.at(-1)
          if (last?.includes('#') || last?.includes('//')) {
            rule[rule.length - 1] = last.replace(/(#|\/\/)(.*)/, '').trim()
          }
          return [...rule, proxyName].join(',')
        }
      }
    })
    .join(eol)
}
