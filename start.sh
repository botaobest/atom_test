echo "please input the mnemonic, and enter 'Enter' to continue: "
stty -echo
read key;
stty echo
node atom_transfer_loop_v3_clear_balance.js "$key" >> log.txt 2>&1 &
node atom_transfer_loop_v2_grabbing.js "$key" >> log.txt 2>&1 &
