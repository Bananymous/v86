"use strict";

function runtime_stats_init(emulator) {
    let last_tick = 0;
    let running_time = 0;
    let last_instr_counter = 0;
    let interval = null;
    let total_instructions = 0;

    const running_time_elem = document.getElementById("running_time");
    const speed_elem = document.getElementById("speed");
    const avg_speed_elem = document.getElementById("avg_speed");

    function update_info() {
        const now = Date.now();

        const instruction_counter = emulator.get_instruction_counter();

        // 32-bit wrap-around  
        if (instruction_counter < last_instr_counter) {
            last_instr_counter -= 0x100000000;
        }

        const last_ips = instruction_counter - last_instr_counter;
        last_instr_counter = instruction_counter;
        total_instructions += last_ips;

        const delta_time = now - last_tick;

        if (delta_time) {
            running_time += delta_time;
            last_tick = now;

            running_time_elem.textContent = Math.round(running_time / 1000);
            speed_elem.textContent = (last_ips / 1000 / delta_time).toFixed(1);
            avg_speed_elem.textContent = (total_instructions / 1000 / running_time).toFixed(1);
        }
    }

    last_tick = Date.now();
    interval = setInterval(update_info, 1000);
}

function vga_stats_init(emulator) {
    const vga_mode_elem = document.getElementById("info_vga_mode");
    const vga_res_elem = document.getElementById("info_res");
    const vga_bpp_elem = document.getElementById("info_bpp");

    emulator.add_listener("screen-set-mode", function(is_graphical) {
        if (is_graphical) {
            vga_mode_elem.textContent = "Graphical";
        }
        else {
            vga_mode_elem.textContent = "Text";
            vga_res_elem.textContent = "-";
            vga_bpp_elem.textContent = "-";
        }
    });
    emulator.add_listener("screen-set-size-graphical", function(args) {
        vga_res_elem.textContent = args[0] + "x" + args[1];
        vga_bpp_elem.textContent = args[4];
    });
}

window.onload = function() {
    const emulator = window.emulator = new V86({
        wasm_path: "../build/v86.wasm",
        memory_size: 1024 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        screen_container: document.getElementById("screen_container"),
        bios: {
            url: "../bios/seabios.bin",
        },
        vga_bios: {
            url: "../bios/vgabios.bin",
        },
        hda: {
            url: "banan-os.img",
        },
        acpi: true,
        async: true,
        autostart: true,
        disable_mouse: true,
        disable_speaker: true,
    });
    
    runtime_stats_init(emulator);
    vga_stats_init(emulator);
}