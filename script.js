const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
const mouse = { x: null, y: null, radius: 150 };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Mobil dokunmatik desteği
window.addEventListener('touchstart', (event) => {
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
});

window.addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
});

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

// Metni Canvas'a yazıp piksellerin koordinatlarını alma
function getTextPoints(text) {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    offCtx.fillStyle = 'white';
    // Ekran genişliğine göre esnek yazı boyutu (responsive)
    // Yazı boyutu daha da küçültüldü (0.08 -> 0.06, 120 -> 90)
    let fontSize = Math.min(canvas.width * 0.06, 90);
    offCtx.font = `bold ${fontSize}px "Arial", sans-serif`;

    // Ekranın tam ortasına hizalama
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';

    // X: Orta, Y: Orta
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const pixels = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
    const points = [];

    // Kaliteyi korumak için gap değerini 3 tutuyoruz.
    const gap = 3;
    for (let y = 0; y < offCanvas.height; y += gap) {
        for (let x = 0; x < offCanvas.width; x += gap) {
            const index = (y * offCanvas.width + x) * 4;
            const alpha = pixels[index + 3];

            if (alpha > 128) {
                points.push({ x: x, y: y });
            }
        }
    }
    return points;
}

class Particle {
    constructor(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;

        // Başlangıçta ekranın her yerine rastgele dağılmış halde
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 0.8 + 0.4;

        // Rastgele süzülme hızı
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;

        this.active = false;
        this.framesSinceLeft = 0;

        // Twinkle (Parıldama) hızı 5 saniyelik tam döngü için ayarlandı (PI / 300 frames)
        this.alpha = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.01047;
    }

    draw() {
        // Opaklığı kuvvet fonksiyonuyla hesaplıyoruz (pow), böylece daha uzun süre sönük kalacaklar
        const baseOpacity = Math.abs(Math.sin(this.alpha));
        const opacity = 0.1 + Math.pow(baseOpacity, 4) * 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // Opaklık fazını ilerlet
        this.alpha += this.twinkleSpeed;

        let distanceToMouse = 9999;

        if (mouse.x !== null && mouse.y !== null) {
            // Farenin, hedeflenen (görünmez) harf pozisyonuna uzaklığı
            let dx = mouse.x - this.targetX;
            let dy = mouse.y - this.targetY;
            distanceToMouse = Math.sqrt(dx * dx + dy * dy);
        }

        // Fare hedefe (harfe) yakınsa parçacığı aktif et
        if (distanceToMouse < mouse.radius) {
            this.active = true;
            this.framesSinceLeft = 0; // Zamanlayıcıyı sıfırla
        } else {
            // Fare uzaklaştıktan 3 saniye (yaklaşık 180 frame) sonra dağıl
            if (this.active) {
                this.framesSinceLeft++;
                if (this.framesSinceLeft > 30000) {
                    this.active = false;
                    this.framesSinceLeft = 0;
                }
            }
        }

        if (this.active) {
            // Nefes efekti - Parçacıkların hafifçe salınmasını sağlar
            let time = Date.now() * 0.002;
            let breathingX = Math.sin(time + (this.targetX * 0.01)) * 1.5;
            let breathingY = Math.cos(time + (this.targetY * 0.01)) * 1.5;

            // Harfi oluşturmak için hedefe doğru uç (Spring / Yay efekti)
            let tx = (this.targetX + breathingX) - this.x;
            let ty = (this.targetY + breathingY) - this.y;

            this.vx += tx * 0.05;
            this.vy += ty * 0.05;
            this.vx *= 0.8; // Sürtünme
            this.vy *= 0.8;

            this.x += this.vx;
            this.y += this.vy;
        } else {
            // Aktif değilken boş ekranda serbestçe süzül (dağılmış halde) - Daha yavaş hareket için değerler düşürüldü
            this.vx += (Math.random() - 0.5) * 0.05;
            this.vy += (Math.random() - 0.5) * 0.05;

            // Hız limiti düşürüldü (1.5 -> 0.6)
            let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 0.6) {
                this.vx = (this.vx / speed) * 0.6;
                this.vy = (this.vy / speed) * 0.6;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Ekran dışına çıkmasını engelle, köşelerden sekip dönsün
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
    }
}

function init() {
    // Canvas boyutlarını init anında tekrar kontrol et
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles = [];
    const textPoints = getTextPoints("Yusuf Emir");
    textPoints.forEach(p => {
        particles.push(new Particle(p.x, p.y));
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
    }
    requestAnimationFrame(animate);
}

init();
animate();

// Ekran yeniden boyutlandırıldığında yazıyı tekrar oluştur
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    }, 200);
});