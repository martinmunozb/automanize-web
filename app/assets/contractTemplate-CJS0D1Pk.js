var e=`<h1 style="text-align:center">CONTRATO DE ARRENDAMIENTO DE VIVIENDA</h1>
<p style="text-align:right">En {{ciudad}}, a {{fecha_firma}}</p>

<h3>REUNIDOS</h3>
<p>De una parte, <strong>{{empresa_nombre}}</strong>, con CIF {{empresa_cif}} y domicilio en {{empresa_direccion}}, representada por {{empresa_representante}} (en adelante, el ARRENDADOR).</p>
<p>De otra parte, <strong>{{inquilino_nombre}}</strong>, con documento {{inquilino_doc}}, teléfono {{inquilino_telefono}} (en adelante, el ARRENDATARIO).</p>

<h3>EXPONEN</h3>
<p>Que el ARRENDADOR es titular del derecho de arrendamiento sobre el inmueble sito en <strong>{{inmueble_direccion}}</strong> ({{inmueble_zona}}) {{habitacion_nombre}}, y ambas partes acuerdan formalizar el presente contrato con arreglo a las siguientes</p>

<h3>CLÁUSULAS</h3>
<p><strong>PRIMERA. Objeto.</strong> El ARRENDADOR cede en arrendamiento al ARRENDATARIO el inmueble descrito, que será destinado a vivienda.</p>
<p><strong>SEGUNDA. Duración.</strong> El contrato tendrá una duración de {{duracion_meses}} meses, con inicio el {{fecha_entrada}} y fin el {{fecha_fin}}.</p>
<p><strong>TERCERA. Renta.</strong> La renta mensual se fija en {{importe_mensual}} € ({{importe_letras}}), a abonar antes del día {{dia_pago}} de cada mes.</p>
<p><strong>CUARTA. Fianza.</strong> El ARRENDATARIO entrega la cantidad de {{fianza}} € ({{fianza_letras}}) en concepto de fianza.</p>
<p><strong>QUINTA. Conservación.</strong> El ARRENDATARIO se obliga a conservar el inmueble y a devolverlo en el mismo estado en que lo recibe.</p>

<p style="margin-top:48px">Y en prueba de conformidad, ambas partes firman el presente contrato por duplicado.</p>
<table style="width:100%;margin-top:48px"><tr>
<td style="width:50%;text-align:center">_______________________<br/>EL ARRENDADOR</td>
<td style="width:50%;text-align:center">_______________________<br/>EL ARRENDATARIO<br/>{{inquilino_nombre}}</td>
</tr></table>`;function t(e,t={}){return String(e||``).replace(/\{\{\s*(\w+)\s*\}\}/g,(e,n)=>Object.prototype.hasOwnProperty.call(t,n)?t[n]??``:e)}export{t as n,e as t};