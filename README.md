
#ESTRUCTURA DE PROYECTO

Tu carpeta de proyecto debe verse de esta forma:
calculator/
│
├── app.py              # Flask backend
├── solver.py           # FunctionSolver class
├── templates/
│   └── index.html      # Calculator frontend
├── static/
│   ├── style.css       # Pastel styles
│   └── script.js       # Frontend logic

#CORRER EL SERVIDOR

Desde el origen del proyecto:

python app.py

*Flask se abrira en http://127.0.0.1:5000
*Abre esa dirección en tu navegador para usar la calculadora

#NOTAS
*Los graficos utilizan matplotlib con Agg backend (No se requiere GUI)
*Rango y Grafico son mostrados en ventanas flotantes con tematica pastel
*Estan disponibles registros/logs de debug en la terminal (Powershell/command prompt)
*Si cambias el codigo CSS/JS, refresca tu navegador para ver los cambios.
