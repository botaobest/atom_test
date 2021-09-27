echo "please input the mnemonic, and enter 'Enter' to continue: "
stty -echo
read key;
stty echo
echo "$key" > key.txt;
node atom_transfer_loop_v3_clear_balance.js >> log.txt 2>&1 &
node atom_transfer_loop_v2_grabbing.js >> log.txt 2>&1 &
sleep 5;
rm key.txt;
