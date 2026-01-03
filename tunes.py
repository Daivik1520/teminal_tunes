import time
import sys
print()
print()
print('finding her:')  
print()

def animate_text(text, char_delay=0.1):
   
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(char_delay)
    print()  
 

lines_with_timing = [
    ("Jana Mere Sawalon Ka Manzar Tu", 0.08, 1.5),
    ("Haan Main Sukha Sa Sara Samandar Tu", 0.1, 0.8),
    ("Haan Gulabi Si Surkhi Jo Dikhti Thi", 0.08, 0.6),
    ("Fir Se Dikh Jaye Toh", 0.1, 0.2),
    ("Jee Bhar Ke Saah Bhar Lu", 0.1, 0.2),
    ("Kati Kitni Thi Raate Nai Soya Main", 0.1, 0.4),
    ("Tujhko Kitna Bulaya Fir Roya Main", 0.1, 0.4),
    ("Teri Sari Woh Baatein Kyu Sone Nahi Deti", 0.1, 0.2),
    ("Sataye Mujhe Haan Fir Khoya Main", 0.1, 0.2),
]

for (line, char_delay, delay_after) in lines_with_timing:
    animate_text(line, char_delay=char_delay)
    time.sleep(delay_after)
