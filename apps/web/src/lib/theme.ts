export const THEME_STORAGE_KEY = 'pv-theme'

/**
 * Script que roda no <head> antes da primeira pintura: aplica o tema
 * salvo (claro/escuro). Sem escolha salva, vale o tema do sistema.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
