
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
    inputAnalyser: AnalyserNode;
    outputAnalyser: AnalyserNode;
    theme: 'light' | 'dark';
    status: 'listening' | 'speaking' | 'idle' | 'processing';
}

// Particle class for the "starry" effect
class Particle {
    x: number;
    y: number;
    radius: number;
    speedY: number;
    opacity: number;

    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100; // Start below screen
        this.radius = Math.random() * 2 + 0.5; // Random size 0.5 - 2.5
        this.speedY = Math.random() * 0.5 + 0.2; // Random upward speed
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update(height: number, amp: number) {
        // Move up, speed increases with amplitude
        this.y -= this.speedY * (1 + amp * 2);
        
        // Reset if goes off screen
        if (this.y < 0) {
            this.y = height + 10;
            this.x = Math.random() * window.innerWidth;
        }
    }

    draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color.replace('OPACITY', this.opacity.toString());
        ctx.fill();
    }
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ inputAnalyser, outputAnalyser, theme, status }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;
        
        // Initialize particles if empty
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < 50; i++) {
                particlesRef.current.push(new Particle(canvas.width, canvas.height));
            }
        }

        let animationFrameId: number;
        let phase = 0;

        const draw = () => {
            // Handle resizing
            if (canvas.parentElement && (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight)) {
                 canvas.width = canvas.parentElement.clientWidth;
                 canvas.height = canvas.parentElement.clientHeight;
            }
            
            const { width, height } = canvas;
            const isDark = theme === 'dark';

            canvasCtx.clearRect(0, 0, width, height);

            // Determine active analyser and base colors
            let activeAnalyser = inputAnalyser;
            let sensitivity = 1.0;
            let r=0, g=0, b=0;

            if (status === 'speaking') {
                activeAnalyser = outputAnalyser;
                sensitivity = 2.5; 
                // Deep Purple/Pink
                if (isDark) { r=192; g=132; b=252; } else { r=147; g=51; b=234; }
            } else if (status === 'listening') {
                activeAnalyser = inputAnalyser;
                sensitivity = 2.0;
                // Cyan/Blue
                if (isDark) { r=34; g=211; b=238; } else { r=8; g=145; b=178; }
            } else if (status === 'processing') {
                sensitivity = 0.8;
                 // Amber/Orange
                if (isDark) { r=251; g=191; b=36; } else { r=217; g=119; b=6; }
            } else {
                // Idle Slate
                sensitivity = 0.2;
                if (isDark) { r=148; g=163; b=184; } else { r=71; g=85; b=105; }
            }

            // Get Audio Data
            const bufferLength = activeAnalyser.frequencyBinCount; // 128 (fftSize/2)
            const dataArray = new Uint8Array(bufferLength);
            activeAnalyser.getByteTimeDomainData(dataArray);

            // Calculate Amplitude (Energy)
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                const v = (dataArray[i] - 128) / 128;
                sum += v * v;
            }
            const rms = Math.sqrt(sum / bufferLength);
            const amplitude = rms * sensitivity; // 0.0 to ~1.5 usually

            // Draw Particles
            const particleColor = `rgba(${r}, ${g}, ${b}, OPACITY)`;
            particlesRef.current.forEach(p => {
                p.update(height, amplitude);
                p.draw(canvasCtx, particleColor);
            });

            // Draw Waves
            // We will draw 3 overlapping waves with slightly different phases/speeds
            const waveCount = 3;
            
            for (let w = 0; w < waveCount; w++) {
                 canvasCtx.beginPath();
                 const lineWidth = isDark ? 2 : 3;
                 canvasCtx.lineWidth = lineWidth;
                 
                 const alpha = (1 - (w * 0.2)) * Math.min(1, amplitude + 0.3); // Fades out further waves
                 canvasCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                 
                 const waveHeight = (height * 0.15) + (amplitude * height * 0.2); // Base height + dynamic height
                 const centerY = height * 0.85; // Bottom area

                 const offset = (w * 20); // Offset distinct waves

                 for (let x = 0; x < width; x++) {
                     // Combine sine waves for fluid effect
                     // Primary slow wave + Secondary fast wave + Audio interaction
                     
                     const progress = x / width;
                     const freq = 5 + w; // Frequency
                     
                     // Use Audio Data for localized distortion if needed, 
                     // but TimeDomainData is jagged. Let's stick to smooth generated sine waves 
                     // modulated by the calculated RMS amplitude.
                     
                     const y = centerY + 
                               Math.sin(progress * freq + phase + w) * waveHeight * Math.sin(progress * Math.PI); // Taper ends
                     
                     if (x === 0) canvasCtx.moveTo(x, y);
                     else canvasCtx.lineTo(x, y);
                 }
                 canvasCtx.stroke();
            }

            // Advance phase
            phase += 0.05 + (amplitude * 0.1); // Speed up with volume

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [inputAnalyser, outputAnalyser, theme, status]);

    return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default AudioVisualizer;
