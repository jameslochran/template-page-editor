// Template Page Editor JavaScript Application

class TemplatePageEditor {
    constructor() {
        this.currentSection = 'editor';
        this.currentTool = null;
        this.templates = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupCanvas();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Toolbar tools
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.selectTool(tool);
            });
        });

        // Toolbar actions
        document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Canvas click
        document.getElementById('canvas').addEventListener('click', (e) => {
            if (this.currentTool) {
                this.addElement(e);
            }
        });

        // Create template button
        document.getElementById('create-template').addEventListener('click', () => {
            this.createNewTemplate();
        });

        // Settings
        document.getElementById('theme').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        if (section === 'templates') {
            this.renderTemplates();
        }
    }

    selectTool(tool) {
        // Update tool selection
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        this.currentTool = tool;
        this.updateCanvasCursor();
    }

    updateCanvasCursor() {
        const canvas = document.getElementById('canvas');
        if (this.currentTool) {
            canvas.style.cursor = 'crosshair';
            canvas.classList.add('tool-active');
        } else {
            canvas.style.cursor = 'default';
            canvas.classList.remove('tool-active');
        }
    }

    setupCanvas() {
        const canvas = document.getElementById('canvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        
        // Hide placeholder when elements are added
        this.observer = new MutationObserver((mutations) => {
            const hasElements = canvas.children.length > 1; // More than just the placeholder
            placeholder.style.display = hasElements ? 'none' : 'block';
        });
        
        this.observer.observe(canvas, { childList: true });
    }

    addElement(event) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const element = this.createElement(this.currentTool, x, y);
        canvas.appendChild(element);

        // Clear tool selection after adding element
        this.selectTool(null);
    }

    createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = `canvas-element ${type}-element`;
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        switch (type) {
            case 'text':
                element.innerHTML = '<input type="text" value="Click to edit text" class="text-input">';
                element.style.width = '200px';
                element.style.height = '30px';
                break;
            case 'image':
                element.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image</span></div>';
                element.style.width = '200px';
                element.style.height = '150px';
                break;
            case 'button':
                element.innerHTML = '<button class="canvas-button">Button</button>';
                element.style.width = '120px';
                element.style.height = '40px';
                break;
            case 'container':
                element.innerHTML = '<div class="container-element">Container</div>';
                element.style.width = '300px';
                element.style.height = '200px';
                element.style.border = '1px dashed #cbd5e1';
                element.style.backgroundColor = '#f8fafc';
                break;
        }

        // Make element draggable
        this.makeDraggable(element);

        return element;
    }

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left);
            startTop = parseInt(element.style.top);
            element.style.zIndex = '1000';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = `${startLeft + deltaX}px`;
            element.style.top = `${startTop + deltaY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = '1';
            }
        });
    }

    handleAction(action) {
        switch (action) {
            case 'preview':
                this.previewPage();
                break;
            case 'save':
                this.saveTemplate();
                break;
        }
    }

    previewPage() {
        const canvas = document.getElementById('canvas');
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Page Preview</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .canvas-element { position: relative !important; }
                    .text-input { border: none; background: transparent; width: 100%; }
                    .image-placeholder { 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        background: #f3f4f6; 
                        border: 1px dashed #d1d5db;
                        height: 100%;
                    }
                    .canvas-button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                ${canvas.innerHTML}
            </body>
            </html>
        `;
        
        previewWindow.document.write(html);
        previewWindow.document.close();
    }

    saveTemplate() {
        const canvas = document.getElementById('canvas');
        const templateData = {
            id: Date.now(),
            name: `Template ${this.templates.length + 1}`,
            html: canvas.innerHTML,
            createdAt: new Date().toISOString()
        };

        this.templates.push(templateData);
        this.saveTemplatesToStorage();
        this.showNotification('Template saved successfully!');
    }

    createNewTemplate() {
        this.switchSection('editor');
        this.clearCanvas();
    }

    clearCanvas() {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = '<div class="canvas-placeholder"><i class="fas fa-mouse-pointer"></i><p>Click on a tool to start building your page</p></div>';
    }

    loadTemplates() {
        const saved = localStorage.getItem('templatePageEditor_templates');
        if (saved) {
            this.templates = JSON.parse(saved);
        }
    }

    saveTemplatesToStorage() {
        localStorage.setItem('templatePageEditor_templates', JSON.stringify(this.templates));
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        if (this.templates.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1 / -1;">No templates yet. Create your first template!</p>';
            return;
        }

        this.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <h3>${template.name}</h3>
                <p>Created: ${new Date(template.createdAt).toLocaleDateString()}</p>
                <div class="template-actions">
                    <button class="btn btn-primary" onclick="app.loadTemplate(${template.id})">Load</button>
                    <button class="btn" onclick="app.deleteTemplate(${template.id})">Delete</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    loadTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            this.switchSection('editor');
            const canvas = document.getElementById('canvas');
            canvas.innerHTML = template.html;
        }
    }

    deleteTemplate(id) {
        if (confirm('Are you sure you want to delete this template?')) {
            this.templates = this.templates.filter(t => t.id !== id);
            this.saveTemplatesToStorage();
            this.renderTemplates();
            this.showNotification('Template deleted successfully!');
        }
    }

    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('templatePageEditor_theme', theme);
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application
const app = new TemplatePageEditor();

// Load saved theme
const savedTheme = localStorage.getItem('templatePageEditor_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme').value = savedTheme;
}
