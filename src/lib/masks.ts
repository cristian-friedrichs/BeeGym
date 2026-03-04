export const maskPhone = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
    value = value.replace(/(\d)(\d{4})$/, "$1-$2")
    return value
}

export const maskCEP = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    if (value.length > 8) value = value.slice(0, 8)
    value = value.replace(/^(\d{5})(\d)/, "$1-$2")
    return value
}

export const maskCPF = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/(\d{3})(\d)/, "$1.$2")
    value = value.replace(/(\d{3})(\d)/, "$1.$2")
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    return value
}

export const maskCNPJ = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    if (value.length > 14) value = value.slice(0, 14)
    value = value.replace(/^(\d{2})(\d)/, "$1.$2")
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2")
    value = value.replace(/(\d{4})(\d)/, "$1-$2")
    return value
}

export const maskDocument = (value: string) => {
    if (!value) return ""
    const cleanValue = value.replace(/\D/g, "")
    if (cleanValue.length <= 11) {
        return maskCPF(value)
    }
    return maskCNPJ(value)
}
