function createConfetti() {
    const colors = ['#4CAF50', '#81C784', '#C8E6C9', '#ffffff', '#FFD700', '#FFA500'];
    const shapes = ['circle', 'square', 'triangle'];
    
    for (let i = 0; i < 200; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        confetti.style.backgroundColor = randomColor;
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 4 + 2) + 's';
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = confetti.style.width;
        
        if (randomShape === 'triangle') {
            confetti.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        } else if (randomShape === 'square') {
            confetti.style.borderRadius = '0';
        }
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 7000);
    }
}
