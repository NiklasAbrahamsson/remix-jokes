import { ActionFunction, Form, LoaderFunction, MetaFunction, redirect, useCatch, useParams } from "remix";
import { Link, useLoaderData } from "remix";
import type { Joke } from "@prisma/client";
import { db } from "~/utils/db.server";
import { getUserId } from '~/utils/session.server';

export const meta: MetaFunction = ({ data }: { data: LoaderData | undefined }) => {
    if (!data) {
        return {
            title: "No joke",
            description: "No joke found"
        };
    }
    return {
        title: `"${data.joke.name}" joke`,
        description: `Enjoy the "${data.joke.name}" joke and much more`
    };
}

type LoaderData = { joke: Joke, isOwner: boolean };

export const loader: LoaderFunction = async ({
    request,
    params
}) => {
    const userId = await getUserId(request);
    const joke = await db.joke.findFirst({
        where: { id: params.jokeid }
    });

    if (!joke) {
        throw new Response("What a joke! Not found.", {
            status: 404
        });
    }

    const data: LoaderData = { joke, isOwner: userId === joke.jokesterId };
    return data;
};

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData();

    if (form.get('_method') === 'delete') {
        const userId = await getUserId(request);
        const joke = await db.joke.findUnique({
            where: {
                id: params.jokeid,
            }
        })

        if (!joke) {
            throw new Response(
                "Can't delete what does not exist",
                { status: 404 }
            );
        }
        if (joke.jokesterId !== userId) {
            throw new Response(
                "Pssh, nice try. That's not your joke",
                {
                    status: 401
                }
            );
        }
        await db.joke.delete({ where: { id: params.jokeid } });
        return redirect('/jokes')
    }
}

export default function JokeRoute() {
    const data = useLoaderData<LoaderData>();
    return (
        <div>
            <p>Here's your hilarious joke:</p>
            <p>{data.joke.content}</p>
            <Link to=".">{data.joke.name} Permalink</Link>
            {data.isOwner ? (
                <Form method="post">
                    <input
                        type="hidden"
                        name="_method"
                        value="delete"
                    />
                    <button type="submit" className="button">
                        Delete
                    </button>
                </Form>
            ) : null}
        </div>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    const { jokeid } = useParams();
    return (
        <div className="error-container">{`There was an error loading joke by the id ${jokeid}. Sorry.`}</div>
    )
}

export function CatchBoundary() {
    const caught = useCatch();
    const params = useParams();

    switch (caught.status) {
        case 404: {
            return (
                <div className="error-container">
                    Huh? What the heck is {params.jokeId}?
                </div>
            );
        }
        case 401: {
            return (
                <div className="error-container">
                    Sorry, but {params.jokeId} is not your joke.
                </div>
            );
        }
        default: {
            throw new Error(`Unhandled error: ${caught.status}`);
        }
    }
}