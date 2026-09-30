
# 🗺️ Visor SIG
 
Sistema de Información Geográfica (SIG) desarrollado con **Next.js** y **FastAPI** para la visualización, gestión y análisis de información geografica.
 
 
## 🏗️ Arquitectura
 
```text
┌─────────────────┐
│ Next.js │
│ Frontend │
└────────┬────────┘
│ REST API
▼
┌─────────────────┐
│ FastAPI │
│ Backend │
└────────┬────────┘
│
▼
┌─────────────────┐
│ PostgreSQL │
│ + PostGIS │
└─────────────────┘
```
 

 
 
## 🔐 Roles
 
| Rol | Permisos |
|------|-----------|
| Administrador | Gestión completa |
| Consultor | Consulta de datos |
 
 
## 🤝 Contribuciones
 
Las contribuciones son bienvenidas.
 
1. Fork del proyecto.
2. Crear una rama:
 
```bash
git checkout -b feature/nueva-funcionalidad
```
 
3. Commit de cambios:
 
```bash
git commit -m "feat: nueva funcionalidad"
```
 
4. Push de la rama:
 
```bash
git push origin feature/nueva-funcionalidad
```
 
5. Crear Pull Request.
 
---
 
## 📄 Licencia
 
Este proyecto se distribuye bajo la licencia MIT.
 
---
 
## 👨‍💻 Autor
 
Desarrollado por el equipo de **In Rainbows Organization**.
 
Proyecto académico y profesional orientado a la gestión y visualización de información geoespacial.
