import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ContactsModule } from './../src/contacts/contacts.module';
import { Contact } from './../src/contacts/entities/contact.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});

describe('ContactsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ContactsModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Contact],
          logging: true,
          synchronize: true,
        }),
      ],
    })
      .setLogger(new Logger())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  //   it('/identity (GET)', () => {
  //     return request(app.getHttpServer()).get('/identity').expect(200).expect([]);
  //   });

  //   it('/identity (POST) primary becomes secondary', async () => {
  //     // create a primary
  //     const res1 = await request(app.getHttpServer())
  //       .post('/identity')
  //       .send({
  //         email: 'george@hillvalley.edu',
  //         phoneNumber: 919191,
  //       })
  //       .expect(201);
  //     expect(res1.body).toMatchObject({
  //       contact: {
  //         primaryContatctId: 1,
  //         emails: ['george@hillvalley.edu'],
  //         phoneNumbers: [919191],
  //         secondaryContactIds: [],
  //       },
  //     });

  //     // create another primary
  //     const res2 = await request(app.getHttpServer())
  //       .post('/identity')
  //       .send({
  //         email: 'biffsucks@hillvalley.edu',
  //         phoneNumber: 717171,
  //       })
  //       .expect(201);
  //     expect(res2.body).toMatchObject({
  //       contact: {
  //         primaryContatctId: 2,
  //         emails: ['biffsucks@hillvalley.edu'],
  //         phoneNumbers: [717171],
  //         secondaryContactIds: [],
  //       },
  //     });

  //     // primary becomes secondary
  //     const res3 = await request(app.getHttpServer())
  //       .post('/identity')
  //       .send({
  //         email: 'george@hillvalley.edu',
  //         phoneNumber: 717171,
  //       })
  //       .expect(201);
  //     expect(res3.body).toMatchObject({
  //       contact: {
  //         primaryContatctId: 1,
  //         emails: ['george@hillvalley.edu', 'biffsucks@hillvalley.edu'],
  //         phoneNumbers: ["919191", "717171"],
  //         secondaryContactIds: [2],
  //       },
  //     });

  //     return res1 && res2 && res3;
  //   });

  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  // FIXME: THESE TESTS DOESN'T WORK, USE BRUNO (CHECK README.md)
  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////

  it('/identity (POST) george 919191', () => {
    // create a primary
    return request(app.getHttpServer())
      .post('/identity')
      .send({
        email: 'george@hillvalley.edu',
        phoneNumber: 919191,
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toMatchObject({
          contact: {
            primaryContatctId: 1,
            emails: ['george@hillvalley.edu'],
            phoneNumbers: [919191],
            secondaryContactIds: [],
          },
        });
      });
  });

  it('/identity (POST) biffsucks 717171', () => {
    return request(app.getHttpServer())
      .post('/identity')
      .send({
        email: 'biffsucks@hillvalley.edu',
        phoneNumber: 717171,
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toMatchObject({
          contact: {
            primaryContatctId: 2,
            emails: ['biffsucks@hillvalley.edu'],
            phoneNumbers: [717171],
            secondaryContactIds: [],
          },
        });
      });
  });

  it('/identity (POST) primary to secondary', () => {
    return request(app.getHttpServer())
      .post('/identity')
      .send({
        email: 'george@hillvalley.edu',
        phoneNumber: 717171,
      })
      .expect(201)
      .then((res) => {
        expect(res.body).toMatchObject({
          contact: {
            primaryContatctId: 1,
            emails: ['george@hillvalley.edu', 'biffsucks@hillvalley.edu'],
            phoneNumbers: ['919191', '717171'],
            secondaryContactIds: [2],
          },
        });
      });
  });
});
