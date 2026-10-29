var e={enviarPorDefecto:!1,mostrarDocumento:!0,mostrarIban:!1,mostrarDesglose:!0,pie:`Este documento acredita el pago recibido y no constituye factura.`,asunto:`Justificante de pago {numero}`};function t(t={}){return{...e,...t?.justificante||{}}}var n=e=>Math.round((Number(e)||0)*100)/100;function r({modo:e,esperado:t,pagado:r,yaJustificado:i=0}){return Math.max(0,n(n(e===`completo`?t:r)-n(i)))}function i(e,t=``){return`Justificante ${e}${t?` - ${t}`:``}`.replace(/[\/:*?"<>|]/g,`-`)+`.pdf`}var a=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),o=e=>`${n(e).toLocaleString(`es-ES`,{minimumFractionDigits:2,maximumFractionDigits:2})} €`,s=e=>e?new Date(e).toLocaleDateString(`es-ES`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):``,c=e=>/^#[0-9a-f]{3,8}$/i.test(String(e||``))?e:`#1e293b`,l=e=>/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(String(e||``))?e:``;function u({numero:t,fechaEmision:n,importe:r,datos:i={},config:u={},logoBase64:d=``,color:f,anulado:p=!1}){let{empresa:m={},pagador:h={}}=i,g={...e,...u},_=c(f),v=l(d),y=(e,t)=>t?`<tr><th>${a(e)}</th><td>${a(t)}</td></tr>`:``,b=g.mostrarDesglose&&i.modo!==`completo`?`
    <table class="grid">
      ${y(`Importe previsto`,o(i.esperado))}
      ${y(`Total pagado hasta la fecha`,o(i.pagadoTotal))}
      ${i.modo===`parcial`?y(`Pendiente`,o(i.pendiente)):``}
      ${i.modo===`exceso`?y(`Pagado de más`,o(i.exceso)):``}
      ${i.modo===`exceso`&&i.nota?y(`Motivo`,i.nota):``}
    </table>`:``;return`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${a(t)}</title><style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12px; margin: 0; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${_}; padding-bottom: 14px; }
.head img { max-height: 60px; max-width: 180px; object-fit: contain; }
.empresa { text-align: right; line-height: 1.5; }
.empresa strong { font-size: 14px; color: ${_}; }
h1 { font-size: 20px; letter-spacing: .08em; color: ${_}; margin: 22px 0 4px; }
.meta { color: #6b7280; margin-bottom: 18px; }
.anulado { display: inline-block; border: 2px solid #dc2626; color: #dc2626; font-weight: bold; padding: 4px 10px; margin-bottom: 12px; letter-spacing: .1em; }
.grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
.grid th { text-align: left; width: 38%; color: #6b7280; font-weight: normal; padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
.grid td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
.total { margin: 18px 0; padding: 14px 16px; background: #f3f4f6; border-left: 4px solid ${_}; display: flex; justify-content: space-between; font-size: 15px; }
.total strong { font-size: 18px; }
.pie { margin-top: 28px; color: #6b7280; font-size: 10.5px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
</style></head><body>
<div class="head">
  <div>${v?`<img src="${v}" alt="">`:``}</div>
  <div class="empresa">
    <strong>${a(m.nombre)}</strong><br>
    ${m.nif?`NIF: ${a(m.nif)}<br>`:``}
    ${m.direccion?`${a(m.direccion)}<br>`:``}
    ${m.email?a(m.email):``}
  </div>
</div>
<h1>JUSTIFICANTE DE PAGO</h1>
<div class="meta">Nº ${a(t)} · Emitido el ${a(s(n))}</div>
${p?`<div class="anulado">ANULADO</div>`:``}
<table class="grid">
  ${y(`Recibido de`,h.nombre)}
  ${g.mostrarDocumento?y(`DNI / NIE`,h.documento):``}
  ${y(`Inmueble`,i.inmueble)}
  ${y(`Concepto`,i.concepto)}
  ${y(`Fecha de pago`,s(i.fechaPago))}
  ${y(`Forma de pago`,i.efectivo?`Efectivo`:`Transferencia / domiciliación`)}
  ${g.mostrarIban?y(`Cuenta de abono`,[m.iban,m.banco].filter(Boolean).join(` · `)):``}
</table>
<div class="total"><span>Importe recibido</span><strong>${o(r)}</strong></div>
${b}
<div class="pie">${a(g.pie)}</div>
</body></html>`}export{t as i,u as n,r,i as t};