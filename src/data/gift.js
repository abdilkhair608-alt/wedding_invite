import { groomName, reception } from './wedding.js';

export const gift = {
  recipient: groomName,
  address: reception.address,
  whatsapp: '6282298231875',
};

export const giftAccounts = [
  { id: 'bri', bank: 'BRI', number: '543101017274507' },
  { id: 'bni', bank: 'BNI', number: '0588286002' },
];

export const giftTypes = {
  transfer: 'Transfer',
  parcel: 'Kirim kado',
  both: 'Transfer & kirim kado',
};
