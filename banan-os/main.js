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

function ide_stats_init(emulator) {
    const stats_storage = {
        read_sectors: 0,
        write_sectors: 0,
    };

    const storage_elem = document.getElementById("info_storage");
    const storage_status_elem = document.getElementById("info_storage_status");
    const storage_sectors_read_elem = document.getElementById("info_storage_sectors_read");
    const storage_sectors_written_elem = document.getElementById("info_storage_sectors_written");

    emulator.add_listener("ide-read-start", function() {
        storage_elem.style.display = "block";
        storage_status_elem.textContent = "Loading ...";
    });
    emulator.add_listener("ide-read-end", function(args) {
        stats_storage.read_sectors += args[2];
        storage_status_elem.textContent = "Idle";
        storage_sectors_read_elem.textContent = stats_storage.read_sectors;
    });
    emulator.add_listener("ide-write-end", function(args) {
        stats_storage.write_sectors += args[2];
        storage_sectors_written_elem.textContent = stats_storage.write_sectors;
    });
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
    
    document.getElementById("runtime_infos").style.display = "block";
    runtime_stats_init(emulator);
    ide_stats_init(emulator);
    vga_stats_init(emulator);
}