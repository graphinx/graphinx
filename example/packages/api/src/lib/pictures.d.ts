import type { ImageFileExtension } from 'image-type';
export declare const supportedExtensions: ImageFileExtension[];
export declare function compressPhoto(buf: Buffer, filename: string, format: 'png' | 'jpeg', { square }: {
    square?: boolean;
}): Promise<void>;
/**
 * Computes the path to a given picture (where it would be stored using `updatePicture`)
 * @param folder Where to store the picture, relative to the storage root
 * @param extension The extension of the picture
 * @param identifier The identifier of the resource (most often the UID or the ID of the resource)
 * @returns The path to the picture, relative to the storage root
 */
export declare function pictureDestinationFile({ folder, extension, identifier, root, }: {
    folder: string;
    extension: 'png' | 'jpg';
    identifier: string;
    root?: string;
}): string;
/**
 * Stores (or replaces) a picture associated with a resource
 * @param resource The resource to update the picture for
 * @param folder Where to store the picture, relative to the storage root
 * @param extension The extension of the picture
 * @param file The file to upload
 * @param identifier The identifier of the resource (most often the UID or the ID of the resource)
 * @param propertyName The column name in the resource's database table that stores the path to the picture
 * @returns The path to the picture, relative to the storage root
 */
export declare function updatePicture({ resource, folder, extension, file, identifier, propertyName, silent, root, }: {
    resource: 'article' | 'event' | 'user' | 'group' | 'school' | 'student-association' | 'photos';
    folder: string;
    extension: 'png' | 'jpg';
    file: File;
    identifier: string;
    propertyName?: string;
    silent?: boolean;
    root?: string;
}): Promise<string>;
