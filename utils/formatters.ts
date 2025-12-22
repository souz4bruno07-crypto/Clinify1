
export const formatCurrency = (val: number | undefined | null) => {
    const value = val || 0;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatK = (val: number | undefined | null) => {
   const value = val || 0;
   if(value >= 1000) return `${(value/1000).toFixed(1)}k`;
   return value.toString();
};

export const formatDateTick = (date: any) => {
    try {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (e) {
        return "--/--";
    }
};

export const parseCurrencyInput = (value: string | undefined | null) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
};

export const formatCurrencyValue = (value: number | undefined | null) => {
    const val = value || 0;
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 11);
    if (v.length > 10) return v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
    return v;
};

export const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2}).*/, "$1.$2.$3-$4");
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3}).*/, "$1.$2");
    return v;
};
