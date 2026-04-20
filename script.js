document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');

    let width, height;

    // Daha yumuşak, göz yormayan pastel renkler (Light Mode için)
    const lightColors = ['#9fb8d9', '#d9a3a8', '#a3c4ab', '#b8a8d1', '#e0bfa5', '#add6ce'];
    const darkColors = ['#a8c7fa', '#f28b82', '#fde293', '#81c995', '#d9c8ff', '#fecdd3'];
    let currentColors = lightColors;

    const toggleBtn = document.getElementById('darkModeToggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            currentColors = darkColors;
            toggleBtn.textContent = '☀️';
        } else {
            currentColors = lightColors;
            toggleBtn.textContent = '🌙';
        }
    });

    // Mouse tracking
    let mouse = {
        x: innerWidth / 2,
        y: innerHeight / 2,
        targetX: innerWidth / 2,
        targetY: innerHeight / 2
    };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            // Distribute particles in a spherical shape
            let theta = Math.random() * Math.PI * 2;
            let phi = Math.acos(Math.random() * 2 - 1);
            let r = Math.random() * 400 + 100; // Radius range

            this.baseX = r * Math.sin(phi) * Math.cos(theta);
            this.baseY = r * Math.sin(phi) * Math.sin(theta);
            this.baseZ = r * Math.cos(phi);

            this.colorIndex = Math.floor(Math.random() * currentColors.length);
            this.size = Math.random() * 2 + 1;

            // Rotation angles
            this.rx = 0;
            this.ry = 0;
        }

        update() {
            // Mouse controls rotation direction
            let targetRy = (mouse.targetX - width / 2) * 0.003;
            let targetRx = (mouse.targetY - height / 2) * 0.003;

            // Smoothly move towards target rotation
            this.ry += (targetRy - this.ry) * 0.05;
            this.rx += (targetRx - this.rx) * 0.05;

            // Time-based continuous rotation
            let time = Date.now() * 0.0003;
            let crx = this.rx + time;
            let cry = this.ry + time;

            // Calculate 3D position
            let x1 = this.baseX * Math.cos(cry) - this.baseZ * Math.sin(cry);
            let z1 = this.baseZ * Math.cos(cry) + this.baseX * Math.sin(cry);

            let y2 = this.baseY * Math.cos(crx) - z1 * Math.sin(crx);
            let z2 = z1 * Math.cos(crx) + this.baseY * Math.sin(crx);

            this.x = x1;
            this.y = y2;
            this.z = z2;

            // Calculate previous position to draw the particle as a dash
            let prevTime = time - 0.03;
            let prx = this.rx + prevTime;
            let pry = this.ry + prevTime;

            let px1 = this.baseX * Math.cos(pry) - this.baseZ * Math.sin(pry);
            let pz1 = this.baseZ * Math.cos(pry) + this.baseX * Math.sin(pry);

            let py2 = this.baseY * Math.cos(prx) - pz1 * Math.sin(prx);
            let pz2 = pz1 * Math.cos(prx) + this.baseY * Math.sin(prx);

            this.prevX = px1;
            this.prevY = py2;
            this.prevZ = pz2;
        }

        draw() {
            let fov = 500;
            if (this.z < -fov) return; // Prevent drawing if too close/behind camera

            // Perspective projection
            let scale = fov / (fov + this.z);
            let prevScale = fov / (fov + this.prevZ);

            let drawX = width / 2 + this.x * scale;
            let drawY = height / 2 + this.y * scale;

            let prevDrawX = width / 2 + this.prevX * prevScale;
            let prevDrawY = height / 2 + this.prevY * prevScale;

            // Fade particles out the further away they are
            let alpha = Math.min(1, Math.max(0.1, scale * 0.6));

            ctx.beginPath();
            ctx.moveTo(prevDrawX, prevDrawY);
            ctx.lineTo(drawX, drawY);
            ctx.strokeStyle = currentColors[this.colorIndex];
            ctx.globalAlpha = alpha;
            ctx.lineWidth = this.size * scale;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }

    let particles = [];
    // Create 800 particles
    for (let i = 0; i < 800; i++) {
        particles.push(new Particle());
    }



    function animate() {
        // Semi-transparent background clear for trail effect or fully clear
        ctx.clearRect(0, 0, width, height);

        // Depth sort to draw furthest particles first
        particles.sort((a, b) => b.z - a.z);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
});
