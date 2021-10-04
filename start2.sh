echo "please input the mnemonic, and enter 'Enter' to continue:"
stty -echo
read key;
stty echo

cd ../test;
git checkout dev;
git pull;
echo "$key" | node sign.js
echo "$key" | node sign1.js
echo "$key" | node sign2.js
node send0.js >> log2.txt 2>&1 &
node send1.js >> log2.txt 2>&1 &
node send2.js >> log.txt 2>&1 &




cd ../atom_test;
git pull;

echo "$key" | node atom_transfer_loop_v3_clear_balance.js >> log.txt 2>&1 &
echo "$key" | node atom_transfer_loop_v2_grabbing_local.js >> log.txt 2>&1 &

echo "$key" | node atom_transfer_loop_v3_clear_balance_remote.js >> log.txt 2>&1 &
echo "$key" | node atom_transfer_loop_v2_grabbing_remote_local.js >> log.txt 2>&1 &
