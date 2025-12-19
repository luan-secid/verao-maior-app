export class Zipcode {
  cep!: string;
  state!: string;
  city!: string;
  neighborhood!: string;
  street!: string;
  location!: {
    type: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
}
