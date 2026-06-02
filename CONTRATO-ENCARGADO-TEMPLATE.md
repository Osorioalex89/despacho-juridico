# Contrato de Prestación de Servicios — Tratamiento de Datos Personales
## (Encargado-Responsable, art. 50 Reglamento LFPDPPP)

**PLANTILLA** · *Adaptar el bloque "DATOS DEL DESPACHO" antes de firmar.*

---

Entre:

- **[RAZÓN SOCIAL DEL DESPACHO]**, representado por **[NOMBRE DEL ABOGADO TITULAR]**, en lo sucesivo "El Responsable"; y
- **[NOMBRE DEL DESARROLLADOR / EMPRESA TI]**, representado por **[NOMBRE]**, en lo sucesivo "El Encargado".

## Primera. Objeto

El Encargado prestará al Responsable los servicios de desarrollo, hospedaje y mantenimiento del Sistema "Despacho Sánchez Cerino" para la gestión de expedientes jurídicos, en los términos descritos en el Anexo A.

## Segunda. Calidad de las partes (LFPDPPP)

- El **Responsable** decide sobre el tratamiento de los datos personales de sus clientes finales.
- El **Encargado** trata los datos personales **únicamente por instrucciones** del Responsable y conforme al presente contrato. Queda prohibido cualquier tratamiento con fines distintos.

## Tercera. Subencargados (Subprocessors)

El Responsable autoriza al Encargado a subcontratar los siguientes servicios para la operación del Sistema:

| Subencargado | Servicio | País |
|--------------|----------|------|
| Railway, Inc. | Hosting de base de datos MySQL | EE.UU. |
| Cloudinary | Almacenamiento de archivos (PDFs) | EE.UU. / Global |
| Twilio SendGrid | Envío de correos transaccionales | EE.UU. |
| Groq Inc. | Inferencia de modelos de IA | EE.UU. |
| Cloudflare | Protección contra bots (Turnstile) | Global |

Cualquier alta o sustitución de subencargado se notificará al Responsable con al menos 30 días de antelación.

## Cuarta. Transferencia internacional

Las transferencias previstas en la cláusula Tercera se realizan al amparo del **artículo 36 de la LFPDPPP** mediante cláusulas contractuales que garantizan un nivel de protección equivalente. El Responsable lo declarará en su Aviso de Privacidad.

## Quinta. Medidas de seguridad

El Encargado garantiza al menos:

- Cifrado AES-256-GCM en reposo de campos sensibles (reporte IA, comentarios, descripciones, análisis, chat).
- Cifrado TLS en tránsito.
- 2FA por correo en cada inicio de sesión.
- Control de acceso por roles.
- Registro inmutable de accesos (`audit_log`), incluyendo descargas y cambios de rol.
- Alertas automáticas ante OTP brute-force, descargas masivas o IP nuevas.
- Backups cifrados.
- Rotación de claves (`scripts/rotate-keys.js`, pendiente F0.3).

## Sexta. Derechos ARCO

El Encargado facilita al Responsable los mecanismos para atender solicitudes ARCO en ≤ 20 días hábiles:

- Exportación de datos del titular: `GET /api/yo/exportar-datos`.
- Solicitud de cancelación: `POST /api/yo/solicitar-cancelacion`.
- Materialización (anonimización): `POST /api/yo/anonimizar/:id` (solo Responsable).

## Séptima. Vulneraciones de seguridad

El Encargado notificará al Responsable cualquier vulneración de seguridad relevante dentro de las **72 horas** siguientes a su detección, con el detalle del incidente y las medidas correctivas.

## Octava. Retención y devolución

Al término del contrato:

1. El Encargado pondrá a disposición del Responsable un export completo de los datos (formato MySQL dump cifrado).
2. Transcurridos 30 días naturales tras la entrega, eliminará los datos remanentes en sus sistemas y los de sus subencargados.
3. La retención posterior se rige por la **Política de Retención** (`RETENTION-POLICY.md`), incluyendo el mínimo de 5 años aplicable a expedientes cerrados por requisito fiscal.

## Novena. Responsabilidad

Cada parte responde frente a los titulares de los datos por los tratamientos que efectivamente realice. El Encargado quedará exento cuando demuestre que el tratamiento se realizó conforme a las instrucciones del Responsable.

## Décima. Vigencia y jurisdicción

El contrato entra en vigor a la firma y se renueva tácitamente cada año salvo aviso en contrario con 30 días de antelación. Para cualquier controversia las partes se someten a los tribunales del estado donde tiene su domicilio el Responsable, renunciando a cualquier otro fuero.

---

**Firmas**

Responsable: ______________________________ Fecha: ______________

Encargado:   ______________________________ Fecha: ______________
